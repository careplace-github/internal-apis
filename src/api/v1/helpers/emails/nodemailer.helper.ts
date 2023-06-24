import { readFileSync, promises as fsPromises } from 'fs';
import fs from 'fs';

import SES_Service from '../../services/ses.service';

// Import logger
import logger from '../../../../logs/logger';

import { AWS_SES_SENDER_EMAIL, AWS_SES_REPLY_TO_EMAIL } from '../../../../config/constants/index';

import EmailHelper from './email.helper';
import nodemailer from 'nodemailer';

/**
 * Class to manage the Nodemailer
 */
export default class NodemailerHelper {
  ses: any;
  /**
   * Constructor
   */

  constructor(SES) {
    this.ses = SES;
  }

  /**
   * Sends an email with attachments
   *
   * @param {Array<String>} receiverEmails - Array of emails to send the email to.
   * @param {String} subject - Subject of the email.
   * @param {import("aws-sdk/clients/ses").HtmlPart} htmlBody - HTML body of the email.
   * @param {String} textBody - Text body of the email.
   * @param {Array<File>} attachments - Array of attachments to send the email to.
   * @param {Array<String>} ccEmails - Array of emails to send the email in CC to.
   * @param {Array<String>} bccEmails - Array of emails to send the email in BCC to.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the SES service.
   *
   * @see https://nodemailer.com/transports/ses/
   */
  async sendEmailWithAttachment(
    receiverEmails,
    subject,
    htmlBody,
    textBody,
    attachments,
    ccEmails,
    bccEmails
  ) {
    const transporter = nodemailer.createTransport({
      SES: this.ses,
    });

    const mailOptions = {
      from: AWS_SES_SENDER_EMAIL,
      to: receiverEmails,
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject,
      html: htmlBody,
      text: textBody,
      attachments: attachments,
    };

    let response = await transporter.sendMail(mailOptions);

    return response;
  }
}
