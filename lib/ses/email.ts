import { SES, AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'

import { logger } from '../logger'

interface SESTools {
  sendEmail: (
    emailArgs: EmailArgs
  ) => Promise<PromiseResult<SES.SendEmailResponse, AWSError>>
}

interface EmailArgs {
  subject: string
  to: string
  bodyText?: string
  bodyHtml?: string
}

function init(sesInstance: SES, sender: string): SESTools {
  return {
    sendEmail: async function sendEmail({
      subject,
      to,
      bodyText,
      bodyHtml,
    }: EmailArgs): Promise<PromiseResult<SES.SendEmailResponse, AWSError>> {
      const charset = 'UTF-8'

      const params = {
        Source: sender,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: charset,
          },
          Body: {
            Text: {
              Data: bodyText,
              Charset: charset,
            },
            Html: {
              Data: bodyHtml,
              Charset: charset,
            },
          },
        },
      }

      const result = await sesInstance.sendEmail(params).promise()

      if (!result || !result.MessageId) {
        throw new Error(`Unable to send email to ${to}`)
      }

      logger.info(`Email sent! MessageId: ${result.MessageId}`)
      return result
    },
  }
}

const sesTools = { init }

export { sesTools }
