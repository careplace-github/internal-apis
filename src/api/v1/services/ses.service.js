// Class to manage the AWS SES service

import AWS from "aws-sdk";
import {
    AWS_ses_region,
    AWS_access_key_id,
    AWS_secret_access_key,
    AWS_ses_sender_email,
    AWS_ses_reply_to_email
} from "../../../config/constants/index.js";

const ses = new AWS.SES({
    region: AWS_ses_region,
    accessKeyId: AWS_access_key_id,
    secretAccessKey: AWS_secret_access_key,
});

export default class SES {

    // Function to send an email
    static async sendEmail(receiverEmail, subject, body) {

        // https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html
        const params = {
            Destination: {
                ToAddresses: [receiverEmail],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: body,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
            // suporte@careplace.pt
            Source: AWS_ses_sender_email,

            ReplyToAddresses: [AWS_ses_reply_to_email],
            
        };

        return ses.sendEmail(params).promise();
    }


    // Function to send an email with a template
    static async sendEmailWithTemplate(email, template, templateData) {
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

        return ses.sendTemplatedEmail(params).promise();
    }

    // Function to create a new email template
    static async createEmailTemplate(templateName, subject, html_body, text_body) {
        const params = {
            TemplateContent: {
                Subject: subject,
                Html: html_body,
                Text: text_body,
            },
            TemplateName: templateName,

        };

        return ses.createTemplate(params).promise();
    }
    

}

