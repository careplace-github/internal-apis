import { readFileSync, promises as fsPromises } from "fs";
import fs from "fs";
import nodemailer from "nodemailer";
// Import logger
import logger from "../../../../logs/logger.js";

import {
  AWS_SES_SENDER_EMAIL,
  AWS_SES_REPLY_TO_EMAIL,
} from "../../../../config/constants/index.js";
// let aws = require("@aws-sdk/client-ses");
import htmlToText from "html-to-text";
import aws from "aws-sdk/clients/ses.js";

import SES_Service from "../../services/ses.service.js";

// Gender id's
const male = 0;
const female = 1;

/**
 * Class with helper and utility functions for the SES email service.
 */
export default class EmailHelper {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * @description - Reads the contents of a file and returns it as a string.
   * @param {String} emailTemplate - The name of to the file containing the email template.
   * @returns {Promise<String>} - The email template as a string.
   */
  async getEmailTemplate(emailTemplate) {
    let filename = `./src/assets/emails/${emailTemplate}`;

    // Check if file has the correct extension
    if (!filename.endsWith(".html")) {
      // If not, add the extension
      filename += ".html";
    }

    // Check if file exists
    if (!fs.existsSync(filename)) {
      throw new Error("File does not exist");
    }

    let template = readFileSync(filename, "utf-8");

    return template;
  }

  /**
   * @description - Substitutes the variables in the email template with the values provided.
   * @param {String} emailTemplate - The name of to the file containing the email template.
   * @param {JSON} data - The data to be inserted in the email template.
   */
  async getEmailTemplateWithData(emailTemplate, data) {
    // Check if the email template is provided
    if (emailTemplate == null) {
      return { error: "Need to provide an email template." };
    }

    // Check if the data is provided
    if (data == null) {
      return { error: "Need to provide data in order to send an email." };
    }

    // Get the email template
    let htmlBody = await this.getEmailTemplate(emailTemplate);

    // Get the keys of the data object
    let keys = Object.keys(data);

    // Iterate over the keys
    // Replace the variables in the email template with the values
    // Each variable may appear multiple times in the email template
    keys.forEach((key) => {
      // Get the value of the key
      let value = data[key];

      // Replace the variables with the respective values
      // The same variable may appear multiple times in the email template
      while (htmlBody.includes(`{{${key}}}`)) {
        htmlBody = htmlBody.replace(`{{${key}}}`, value);
      }
    });

    

    // Get the subject
    let subject = htmlBody.match(/<title>(.*?)<\/title>/g);

    // Remove the <title> tags
    subject = subject[0].replace("<title>", "").replace("</title>", "");

    
    

    if (subject === "" || subject === null || subject === undefined) {
      subject = "Careplace";
    } 
    
    return { htmlBody: htmlBody, subject: subject };
  }

  /**
   * @description - Gets the variables in the email template.
   * @param {String} emailTemplate - The name of to the file containing the email template.
   * @returns {Promise<Array>} - An array containing the variables in the email template.
   */
  async getEmailVariables(emailTemplate) {
    // Get the email template
    const template = await this.getEmailTemplate(emailTemplate);

    // Get the variables
    // The variables are in the format {{variable}}
    const variables = template.match(/{{(.*?)}}/g);

    // Remove duplicate variables
    const uniqueVariables = [...new Set(variables)];

    // Remove the {{ and }} from the variables
    const variablesWithoutBrackets = uniqueVariables.map((variable) => {
      return variable.replace("{{", "").replace("}}", "");
    });

    return variablesWithoutBrackets;
  }

  /**
   * @description - Gets the subject of the email template.
   * @param {String} emailTemplate - The name of to the file containing the email template.
   * @returns {Promise<String>} - The subject of the email template.
   */
  async getEmailSubject(emailTemplate, data) {
    // Get the email template
    let template = await this.getEmailTemplateWithData(emailTemplate, data);

    // Get the subject
    // The subject is in the format <title>Subject</title>
    // The title tag is conditional so it may appear 2 times in the email template
    // Return both matches in an array in two different indexes of the array
  }

  /**
   * @description - Gets the names of the email templates.
   * @returns {Promise<Array>} - An array containing the names of the email templates.
   * @throws {Error} - If the email templates folder does not exist.
   * @throws {Error} - If the email templates folder is empty.
   * @throws {Error} - If the email templates folder contains files that are not html.
   * @throws {Error} - If the email templates folder contains files that do not have the .html extension.
   */
  async getEmailTemplatesNames() {
    // Get the email templates folder
    const emailTemplatesFolder = "./src/emails";

    // Check if the email templates folder exists
    if (!fs.existsSync(emailTemplatesFolder)) {
      throw new Error("The email templates folder does not exist.");
    }

    // Get the names of the email templates
    const emailTemplatesNames = fs.readdirSync(emailTemplatesFolder);

    // Check if the email templates folder is empty
    if (emailTemplatesNames.length === 0) {
      throw new Error("The email templates folder is empty.");
    }

    // Check if the email templates folder contains files that are not html
    emailTemplatesNames.forEach((emailTemplateName) => {
      if (!emailTemplateName.endsWith(".html")) {
        throw new Error(
          "The email templates folder contains files that are not html."
        );
      }
    });

    // Check if the email templates folder contains files that do not have the .html extension
    emailTemplatesNames.forEach((emailTemplateName) => {
      if (!emailTemplateName.endsWith(".html")) {
        throw new Error(
          "The email templates folder contains files that do not have the .html extension."
        );
      }
    });

    // Remove the .html extension from the email templates names
    emailTemplatesNames.forEach((emailTemplateName, index) => {
      emailTemplatesNames[index] = emailTemplateName.replace(".html", "");
    });

    return emailTemplatesNames;
  }

  /**
   * @description - Gets the email templates, with the respective names and variables.
   * @returns {Promise<Array>} - An array containing the email templates, with the respective names and variables.
   * @throws {Error} - If the email templates folder does not exist.
   * @throws {Error} - If the email templates folder is empty.
   * @throws {Error} - If the email templates folder contains files that are not html.
   */
  async getEmailTemplates() {
    // Get the names of the email templates
    const emailTemplatesNames = await this.getEmailTemplatesNames();

    // Get the email templates
    const emailTemplates = await Promise.all(
      emailTemplatesNames.map(async (emailTemplateName) => {
        // Get the variables
        const variables = await this.getEmailVariables(emailTemplateName);

        // Get the subject
        const subject = await this.getEmailSubject(emailTemplateName);

        // Get the email template
        const emailTemplate = await this.getEmailTemplate(emailTemplateName);

        // Return the email template
        return {
          name: emailTemplateName,
          variables,
          subject,
          emailTemplate,
        };
      })
    );

    return emailTemplates;
  }

  /**
   * Sends an email with attachments
   *
   * @param {Array<String>} receiverEmails - Array of emails to send the email to.
   * @param {String} subject - Subject of the email.
   * @param {import("aws-sdk/clients/ses.js").HtmlPart} htmlBody - HTML body of the email.
   * @param {String} textBody - Text body of the email.
   * @param {Array<File>} attachments - Array of attachments to send the email to.
   * @param {Array<String>} ccEmails - Array of emails to send the email in CC to.
   * @param {Array<String>} bccEmails - Array of emails to send the email in BCC to.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the SES service.
   *
   * @see https://nodemailer.com/transports/ses/
   * @see https://github.com/andris9/nodemailer-html-to-text
   */
  async sendEmailWithAttachment(
    receiverEmail,
    subject,
    htmlBody,
    textBody,
    attachments,
    ccEmails,
    bccEmails
  ) {
    let SES = new SES_Service();
    let ses = await SES.getSES();
    const transporter = nodemailer.createTransport({
      SES: { ses, aws },
    });

    // transporter.use("compile", htmlToText.htmlToText());

    const mailOptions = {
      from: AWS_SES_SENDER_EMAIL,
      to: receiverEmail,
      replyTo: AWS_SES_REPLY_TO_EMAIL,
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject,
      html: htmlBody,
      //      text: textBody,
      attachments: attachments,
    };

    let response = await transporter.sendMail(mailOptions);

    for (let attachment of attachments) {
     var filePath = attachment.path;

      fs.unlink.bind(fs, filePath)
      
    }

    return response;
  }
}
