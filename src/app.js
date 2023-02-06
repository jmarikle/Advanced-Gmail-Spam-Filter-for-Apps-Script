import stripJsonComments from 'strip-json-comments';
import { decode as decodeHTMLEntities } from 'html-entities';
import { mergeWith, isArray } from 'lodash';
/**
 *
 * @returns { Promise }
 */
const getUnreadMessages = function () {
    return new Promise((resolve, reject) => {
        try {
            const threads = GmailApp.search("label:unread");

            const details = threads.map((thread, index) => {
                const message = thread.getMessages()[0];
                const content = message.getRawContent();
                let ip, id;

                if(content) {
                ip =
                    (ip = content.match(/client-ip=(.*?)\;/)) ?
                    ip.pop() : '';
                id =
                    (id = content.match(/Message-ID:\s*<([^>]*)/i)) ?
                    id.pop() : '';
                }
                const link = "//mail.google.com/mail/u/0/#search/rfc822msgid%3A"+id+"+in%3Aanywhere";
                const subject = message.getSubject();
                const from = message.getFrom().replace(/</g, '(').replace(/>/g, ')').replace(/(.*) (.+?)$/, '$1<br>$2');
                const to = '-->' + message.getTo() + '<--';

                return {
                    content,
                    ip,
                    id,
                    link,
                    subject,
                    from,
                    to,
                    thread
                }
            });

            resolve(details);
        } catch (error) {
            reject(error);
        }
    })
}

/**
 *
 * @param { GoogleAppsScript.Gmail.GmailThread } thread
 */
const markMessageAsSpam = function (thread) {
    thread
        .moveToSpam()
        .markRead();
}

/**
 * @param { RegExp[] } regex
 * @param { string } search
 * @returns { boolean }
 */
const getMatchingRuleIndex = function(regex, search)
{
  return regex.reduce((prev, cur, index) => {
    if (prev !== false) {
        return prev;
    }

    return cur.test(search) ? index : false
  }, false);
}

/**
 *
 * @param { GoogleAppsScript.Gmail.GmailThread } thread
 * @param { string } type
 * @param { number } index
 */
const applyRuleLabel = function(thread, type, index)
{
    let labelName = 'GmailApp/rules/' + type + '-' + index;

    let label = GmailApp.getUserLabelByName(labelName)

    if (!label) {
        GmailApp.createLabel(labelName);
    }

    thread.addLabel(label)
}

const mergeRules = function(object, other)
{
    function customizer(objValue, srcValue) {
        if (isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }

    return mergeWith(object, other, customizer);
}

export {
    // custom functions
    getUnreadMessages,
    markMessageAsSpam,
    getMatchingRuleIndex,
    applyRuleLabel,
    mergeRules,

    // third-pary functions
    stripJsonComments,
    decodeHTMLEntities,
}
