const {
    getUnreadMessages,
    markMessageAsSpam,
    markMessageAsRead,
    getMatchingRuleIndex,
    applyRuleLabel,
    stripJsonComments,
    decodeHTMLEntities,
    mergeRules
} = FilterSpam;

const runSpamFilter = async () => {
    const ruleSets = getRules();

    // This is how we're persisting the history ID. If you need to do
    // a full execution against all unread messages, you can delete
    // the history ID first via resetHistoryId and then execute
    // runSpamFilter. Note that this only gets unread messages, so it
    // won't work against read messages you want flagged as spam.
    const historyId = PropertiesService.getUserProperties().getProperty('historyId')
    const unreadMessages = await getUnreadMessages(historyId);
    PropertiesService.getUserProperties().setProperty('historyId', unreadMessages.historyId);

    // This is all me.  I have an ignore label that I use to "soft"
    // ignore certain messages.  They get marked as read but I can
    // still see them in my inbox.  Appologies for this very useless
    // code in my public prository. :S
    const ignoreLabelId = Gmail.Users.Labels.list('me')
        ?.labels
        .find(l => l.name === 'Ignore')
        .id

    // Here we filter the messages so we can report on the ones we
    // marked as spam.
    const filteredMessages = unreadMessages
        .messages
        .filter(details => {
            let { id, threadId, labelIds } = details;

            // loop over every rule we have and execute its
            // comparison to determine if it should be marked as spam
            for (const [key, rules] of Object.entries(ruleSets)) {
                let regexps = rules.map(([pattern, flags]) => {
                    flags = flags ? flags : undefined;
                    return new RegExp(pattern, flags);
                });

                // This method should be renamed. It's more than just
                // the index. This is how we get any matching rules.
                // A matching rule means the message was detected as
                // spam.
                let matches = getMatchingRuleIndex(regexps, details[key])

                // Just my ignore lable thing. This is really what I
                // want from my ignore label.
                if (ignoreLabelId && labelIds.includes(ignoreLabelId)) {
                    markMessageAsRead(threadId);
                }

                // lastly, we'll execute on the match. Mark it as
                // spam and apply the tule label so we can track what
                // rule triggered the marking as spam.
                if ( matches !== false ) {
                    applyRuleLabel(threadId, key, matches);
                    markMessageAsSpam(threadId);

                    // return true because it was marked as spam.
                    // This is for the filter method so we can track
                    // what messages we marked as spam for logging
                    // purposes.
                    return true;
                }
            }

            // Otherwise, we don't need to report on this message. We
            // can just ignore it now.
            return false;
        })

    const affectedEmailSubjects = filteredMessages.map(data => data.subject);

    Logger.log({ historyId, affectedEmailSubjects })
    return affectedEmailSubjects
};

const getRules = (json = false) => {
    // build a basic structure for our rules so we have a complete
    // rule set when we check against spam
    const baseRules = JSON.parse(
        stripJsonComments(
            decodeHTMLEntities(
                HtmlService.createHtmlOutputFromFile("rules.jsonc.html").getContent()
            )
        )
    );

    // get our rules from user properties
    const userRules = JSON.parse(
        PropertiesService.getUserProperties().getProperty('rules')
    ) || {};

    // merge them to ensure no undefined or inaccessible rule sets.
    const combinedRules = mergeRules(baseRules, userRules);

    // need to allow for JSON stringify so we can write the rules
    // where needed.
    return json ? JSON.stringify(combinedRules) : combinedRules;
}

// add rule is mostly for clasp function calls.  You wouldn't call
// this from apps scripts and it isn't called from the codebase.
const addRule = (type, regex, flags) => {
    const combinedRules = mergeRules(getRules(), {
        // we filter out the flags if they are undefined. Now that I
        // look at this, this is increadible fragile.
        // TODO: fix fragile code :P
        [type]: [[regex, flags].filter((v) => new Boolean(v))]
    });

    setRules(combinedRules)

    return combinedRules
}

// set rules is a little stronger. It allows setting all the rules.
// This woulld be needed if you want to blow away everything and
// replace it with a predefined set.  Good for backup and restore in
// case things go south with adding a rule.
const setRules = (rules) => {
    PropertiesService
        .getUserProperties()
        .setProperty('rules', JSON.stringify(rules))
}

// This is for emergencies only.  Here you can completely blow away
// your rules so you can start from scratch adding rules
const resetRules = () => {
    setRules({})
}

// Reset history ID. Mostly for debugging. This should be run from
// Apps Scripts frontend. It blows away the history ID in the event
// a message is not being properly marked as spam. It was likely
// missed in a failed call earlier and passed by by the current
// history state.
const resetHistoryId = () => {
  const service = PropertiesService.getUserProperties()
  Logger.log('Reseting historyId. Previous value: ' + service.getProperty('historyId'))
  service.deleteProperty('historyId')
}
