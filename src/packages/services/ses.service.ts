// aws
import AWS from 'aws-sdk';

// @api
import { EmailHelper } from '../helpers';
import { LayerError } from '@utils';

// @constants
import {
  AWS_SES_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
  AWS_SES_SENDER_EMAIL,
  AWS_SES_REPLY_TO_EMAIL,
} from '@constants';
// @logger
import logger from '@logger';

// FIXME Use custom LayerError error handling
// FIXME Check the Stripe Error Api Response and update the error handling accordingly
// TODO Add request logging
// TODO Add response logging

/**
 * Class to manage the `AWS SES` Service
 */
export default class SES {
  /**
   * SES instance
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
   */
  static SES = new AWS.SES({
    region: AWS_SES_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACESS_KEY,
  });

  static EmailHelper = EmailHelper;

  static async getSES() {
    return this.SES;
  }

  /**
   * Sends an email
   *
   * @param {String} subject - Subject of the email
   * @param {String} body - Body of the email   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property
   */
  static async sendEmail(
    receiverEmails: string[],
    subject: string,
    htmlBody: string,
    textBody = '',
    ccEmails?: string[],
    bccEmails?: string[]
  ): Promise<AWS.SES.SendEmailResponse | AWS.AWSError> {
    // https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html
    const params = {
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
          Text: {
            Charset: 'UTF-8',
            Data: textBody ? textBody : 'htmlBody',
          },
        },

        // Subject
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },

      // Email Address, CC and BCC
      Destination: {
        ToAddresses: receiverEmails,
        CcAddresses: ccEmails,
        BccAddresses: bccEmails,
      },

      // ReplyTo
      ReplyToAddresses: [AWS_SES_REPLY_TO_EMAIL],

      // Source
      Source: AWS_SES_SENDER_EMAIL,
    };

    const emailSent = await this.SES.sendEmail(params).promise();

    return emailSent;
  }
}
