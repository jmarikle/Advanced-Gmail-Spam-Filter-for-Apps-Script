import stripJsonComments from 'strip-json-comments';
import { decode as decodeHTMLEntities } from 'html-entities';
import { mergeWith, isArray } from 'lodash';
/**
 *
 * @returns { Promise }
 */
const getUnreadMessages = function (historyId=null) {
    return new Promise((resolve, reject) => {
        try {
            const batchBoundary = `batch_${(new Date()).getTime()}`
            let messages = []

            if (historyId) {
                let nextPageToken = null
                do {
                    const response = Gmail.Users.History.list('me', {
                        historyTypes: [
                          "messageAdded"
                        ],
                        startHistoryId: historyId,
                        pageToken: nextPageToken
                    })

                    if (response.history) {
                        messages.push(...response.history.reduce((prev, curr) => {
                            let candidateMessages = curr.messages.map((v) => {
                                const { id, threadId } = v

                                return {
                                    id,
                                    threadId
                                }
                            })

                            prev.push(...candidateMessages.filter((message) => {
                                const f = curr.messagesAdded.find((addedMessage) => {
                                    const {message: { id, labelIds }} = addedMessage
                                    return id === message.id && labelIds.includes('UNREAD')
                                })

                                return typeof f !== 'undefined'
                            }))

                            return prev
                        }, []))
                    }

                    ({ historyId, nextPageToken } = response)
                } while (nextPageToken)
            } else {
                let list = Gmail.Users.Messages.list('me', {
                  q: 'is:unread'
                })
                if (list.messages) {
                    ({ historyId } = Gmail.Users.Messages.get('me', list.messages[0].id))
                }

                messages = list.messages
            }

            if (!messages.length) {
                resolve({
                    messages: [],
                    historyId
                })
                return;
            }

            const batchBody = messages.reduce((body, messageData) => {
              return body + `--${batchBoundary}
Content-Type: application/http

GET /gmail/v1/users/me/messages/${messageData.id}?format=full

`}, '')
            const authToken = ScriptApp.getOAuthToken()

            const response = UrlFetchApp.fetch("https://www.googleapis.com/batch/gmail/v1", {
              contentType: `multipart/mixed; boundary=${batchBoundary}`,
              headers: {
                Authorization: "Bearer " + authToken,
              },
              method: "post",
              payload: `${batchBody}--${batchBoundary}--`,
              muteHttpExceptions: true,
            })

            const parsedResponse = parseBatchRequest(response.getContentText())

            let parsedMessages = parsedResponse.map((response) => {
              const {
                threadId,
                labelIds,
                payload: {
                  headers,
                  parts = [],
                  body
                }
              } = response

              const unwrap = (o) => {
                  const c = (o.parts || []).reduce((all, p) => {
                      return [...all, ...unwrap(p)]
                  }, [])
                  return [o.body?.data, ...c].filter(v => v)
              };
              let b = unwrap({ body, parts });

              let decodedBody = b.map(v => {
                let decoded = Utilities.base64DecodeWebSafe(v)
                return Utilities.newBlob(decoded).getDataAsString()
              }).join('');

              const messageId = headers.find(v => v.name.toLowerCase() === 'message-id')
                ?.value
              const subject = headers.find(v => v.name.toLowerCase() === 'subject')
                ?.value
              const from = headers.find(v => v.name.toLowerCase() === 'from')
                ?.value
              const to = headers.find(v => v.name.toLowerCase() === 'to')
                ?.value
              const clientIp = headers.find(v => v.name.toLowerCase() === 'received-spf')
                ?.value
                .match(/(?<=client-ip=)[.\d]*/)
                .toString()
              const link = "//mail.google.com/mail/u/0/#search/rfc822msgid%3A"+messageId+"+in%3Aanywhere"

              return {
                content: decodedBody,
                ip: clientIp,
                id: messageId,
                link,
                subject,
                from,
                to,
                threadId,
                labelIds
              }
            })

            resolve({
                messages: parsedMessages,
                historyId
            })
        } catch (error) {
            reject(error);
        }
    })
}

/**
 *
 * @param { string } threadId
 */
const markMessageAsSpam = function (threadId) {
    Gmail.Users.Threads.modify({
        addLabelIds: [
            'SPAM'
        ],
        removeLabelIds: [
            'UNREAD'
        ]
    }, 'me', threadId)
}

/**
 *
 * @param { string } threadId
 */
const markMessageAsRead = function (threadId) {
    Gmail.Users.Threads.modify({
        removeLabelIds: [
            'UNREAD'
        ]
    }, 'me', threadId)
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
 * @param { string } threadId
 * @param { string } type
 * @param { number } index
 */
const applyRuleLabel = function(threadId, type, index)
{
    let thread = GmailApp.getThreadById(threadId)

    let labelName = 'GmailApp/rules/' + type + '-' + index

    let label = GmailApp.getUserLabelByName(labelName)

    if (!label) {
      label = GmailApp.createLabel(labelName)
    }

    label.addToThread(thread)
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

const parseBatchRequest = (content) => {
  return content
    .match(/--batch_.+?(?=--batch_)/sg)
    .reduce((messages, messageContent) => {
      const jsonData = messageContent.match(/{.*}/ms);

      if (!jsonData) {
        return messages
      }

      try {
        messages.push(JSON.parse(
          jsonData[0]
        ))

        return messages
      } catch (error) {
        console.log(error)
      }
    }, [])
}

export {
    // custom functions
    getUnreadMessages,
    markMessageAsSpam,
    markMessageAsRead,
    getMatchingRuleIndex,
    applyRuleLabel,
    mergeRules,

    // third-pary functions
    stripJsonComments,
    decodeHTMLEntities,
}
