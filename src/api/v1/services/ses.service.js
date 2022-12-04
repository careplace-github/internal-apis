// Class to manage the AWS SES service

import AWS from "aws-sdk";
import {
    AWS_ses_region,
    AWS_ses_access_key_id,
    AWS_ses_secret_access_key,
} from "../../../config/constants/index.js";

const ses = new AWS.SES({
    region: AWS_ses_region,
    accessKeyId: AWS_ses_access_key_id,
    secretAccessKey: AWS_ses_secret_access_key,
});

export default class SES {

    // Function to send an email
    static async sendEmail(email, subject, body) {
        const params = {
            Destination: {
                ToAddresses: [email],
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
            Source: "",
        };

        return ses.sendEmail(params).promise();
    }


    // Function to send an email with a template
    static async sendEmailWithTemplate(email, subject, template, templateData) {
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
                    Data: subject,
                },
            },
            Source: "",
            Template: templateData,
        };

        return ses.sendTemplatedEmail(params).promise();
    }

    // Function to create a new email template
    static async createTemplate(templateName, subject, body) {
        const params = {
            Template: {
                TemplateName: templateName,
                SubjectPart: subject,
                HtmlPart: body,
            },
        };

        return ses.createTemplate(params).promise();
    }
    

}

