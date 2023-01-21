// Class to manage the AWS SES service

import AWS from "aws-sdk";
import {
  AWS_SES_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
  AWS_SES_SENDER_EMAIL,
  AWS_SES_REPLY_TO_EMAIL,
} from "../../../config/constants/index.js";

import NodemailerHelper from "../helpers/emails/nodemailer.helper.js";
import EmailHelper from "../helpers/emails/email.helper.js";

/**
 * Creates a new EmailHelper instance
 */
const emailHelper = new EmailHelper();

/**
 * Creates a new SES instance
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
 */
const ses = new AWS.SES({
  region: AWS_SES_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACESS_KEY,
});

/**
 * Class to manage the AWS SES Service
 */
export default class SES {
  /**
   * Constructor
   */
  constructor() {
    this.ses = ses;
  }

  async getSES() {
    return this.ses;
  }

  /**
   * Sends an email
   *
   * @param {Array<String>} receiverEmails - Array of emails to send the email to
   * @param {String} subject - Subject of the email
   * @param {String} body - Body of the email
   * @returns {Promise<JSON>} - Promise that resolves to the response from the SES service.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property
   */
  async sendEmail(
    receiverEmails,
    subject,
    htmlBody,
    textBody,
    ccEmails,
    bccEmails
  ) {
    // https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html
    const params = {
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: htmlBody,
          },
          Text: {
            Charset: "UTF-8",
            Data: textBody ? textBody : "htmlBody",
          },
        },

        // Subject
        Subject: {
          Charset: "UTF-8",
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
      ReplyToAddresses: ["suporte@careplace.pt"],

      // Source
      Source: "Careplace <noreply@careplace.pt>",
    };

    return this.ses.sendEmail(params).promise();
  }

  /**
   * @override
   *
   * Sends an email with a template
   *
   * @param {String} email - Email addresses to send the email to.
   * @param {String} template - Name of the template to use.
   * @param {JSON} templateData - Data to use in the template.
   * @param {Array<File>} attachments - Array of attachments to send with the email.
   * @param {Array<String>} ccEmails - Array of emails to send the email to.
   * @param {Array<String>} bccEmails - Array of emails to send the email to.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the SES service.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property
   * @see https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html
   */
  async sendEmailWithTemplate(
    emails,
    template,
    templateData,
    attachments = [],
    ccEmails,
    bccEmails
  ) {
    // Check if the template is not null, undefined or empty
    if (template !== null && template !== undefined && template !== "") {
      // Get the email template with embebed data from the helper
      const emailToSend = await this.emailHelper.getEmailWithData(
        template,
        templateData
      );

      // Send the email with the transporter
      return this.transporter.sendEmailWithAttachment(
        emails,
        emailToSend.subject,
        emailToSend.htmlBody,
        emailToSend.textBody,
        attachments,
        ccEmails,
        bccEmails
      );
    } else {
      // Send the email without the transporter
      const emailToSend = await this.sendEmail(
        emails,
        (template = null),
        (templateData = null),
        ccEmails,
        bccEmails
      );

      return emailToSend;
    }
  }

  /**
   * @deprecated
   * We are managing the templates with the folder './src/assets/emails' and using the helper EmailHelper ('./src/api/v1/helpers/email.helper.js') to manage the templates data.
   * If the templates don't have any attachment, we are using the function 'sendEmail' from this class to send the email.
   * Otherwise, we are using the helper NodemailerHelper ('./src/api/v1/helpers/nodemailer.helper.js') to send the email.
   *
   * Sends an email with a template
   *
   * @param {String} email - Email address to send the email to.
   * @param {String} template - Name of the template to use.
   * @param {JSON} templateData - Data to use in the template.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the SES service.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendTemplatedEmail-property
   */
  async sendEmailWithTemplate(email, template, templateData) {
    const params = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: template,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Subject",
        },
      },
      Source: "",
      Template: templateData,
    };

    return this.ses.sendTemplatedEmail(params).promise();
  }

  /**
   * @deprecated We are managing the templates with the folder './src/assets/emails'.
   *
   * Creates an email template
   *
   * @param {String} templateName - Name of the template to create.
   * @param {String} subject - Subject of the email template to create.
   * @param {import("aws-sdk/clients/ses.js").HtmlPart} html_body - HTML body of the email template to create.
   * @param {String} text_body - Text body of the email template to create.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the SES service.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#createTemplate-property
   */
  async createEmailTemplate(templateName, subject, html_body, text_body) {
    const params = {
      TemplateContent: {
        Subject: subject,
        Html: html_body,
        Text: text_body,
      },
      TemplateName: templateName,
    };

    return this.ses.createTemplate(params).promise();
  }
}
