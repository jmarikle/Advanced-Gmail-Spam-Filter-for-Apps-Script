const {
    getUnreadMessages,
    markMessageAsSpam,
    getMatchingRuleIndex,
    applyRuleLabel,
    stripJsonComments,
    decodeHTMLEntities,
    mergeRules
} = FilterSpam;

const runSpamFilter = async () => {
    const ruleSets = getRules();
    const unreadMessages = await getUnreadMessages();

    const filteredMessages = unreadMessages
        .filter(details => {
            let { id, thread } = details;

            for (const [key, rules] of Object.entries(ruleSets)) {
                let regexps = rules.map(([pattern, flags]) => {
                    flags = flags ? flags : undefined;
                    return new RegExp(pattern, flags);
                });

                let matches = getMatchingRuleIndex(regexps, details[key])

                if ( matches !== false ) {
                    applyRuleLabel(thread, key, matches);
                    markMessageAsSpam(thread);
                    return true;
                }
            }

            return false;
        })

    const affectedEmails = filteredMessages.map(data => data.subject);

    console.log(affectedEmails)
    return affectedEmails
};

const getRules = (json = false) => {
    const baseRules = JSON.parse(
        stripJsonComments(
            decodeHTMLEntities(
                HtmlService.createHtmlOutputFromFile("rules.jsonc.html").getContent()
            )
        )
    );

    const userRules = JSON.parse(
        PropertiesService.getUserProperties().getProperty('rules')
    ) || {};

    const combinedRules = mergeRules(baseRules, userRules);

    return json ? JSON.stringify(combinedRules) : combinedRules;
}

const addRule = (type, regex, flags) => {
    const combinedRules = mergeRules(getRules(), {
        [type]: [[regex, flags].filter((v) => new Boolean(v))]
    });

    PropertiesService
        .getUserProperties()
        .setProperty('rules', JSON.stringify(combinedRules));

    return combinedRules
}

const setRules = (rules) => {
    PropertiesService
        .getUserProperties()
        .setProperty('rules', JSON.stringify(rules));
}

const resetRules = () => {
    PropertiesService
        .getUserProperties()
        .setProperty('rules', JSON.stringify({}));
}
