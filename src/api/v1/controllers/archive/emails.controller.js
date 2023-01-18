// Import logger
import logger from "../../../../logs/logger.js";

// Import utils
import EmailHelper from "../../helpers/emails/email.helper.js";
import requestUtils from "../../utils/server/request.utils.js";

// Import  SES Service
import SES from "../../services/ses.service.js";



export default class EmailsController {
  static async index(req, res, next) {
    var request = requestUtils(req);

    logger.info(
      "Emails Controller INDEX: " + JSON.stringify(request, null, 2) + "\n"
    );

    var response = await EmailHelper.getEmailTemplates();

    logger.info(
      "Emails Controller INDEX Response: " +
        JSON.stringify(response, null, 2) +
        "\n"
    );

    res.status(200).json(response);
  }

  static async show(req, res, next) {
    var request = requestUtils(req);

    logger.info(
      "Emails Controller SHOW: " + JSON.stringify(request, null, 2) + "\n"
    );

    var body = await EmailHelper.getEmailTemplate(req.params.name);
    var subject = await EmailHelper.getEmailSubject(req.params.name);
    var variables = await EmailHelper.getEmailVariables(req.params.name);

    var response = {
        name: req.params.name,
        subject: subject,
        variables: variables,
        body: body,
    }

    logger.info(
      "Emails Controller SHOW Response: " +
        JSON.stringify(response, null, 2) +
        "\n"
    );

    res.status(200).json(response);
  }

  static async getEmailWithVariables(req, res, next) {
    var request = requestUtils(req);

    logger.info(
      "Emails Controller GET EMAIL WITH VARIABLES: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    const email = await EmailHelper.getEmailWithData(req.params.name, req.body);

   
   
    var response = {
        subject: email.subject,
        body: email.body,
    }

    logger.info(
      "Emails Controller GET EMAIL WITH VARIABLES Response: " +
        JSON.stringify(response, null, 2) +
        "\n"
    );

    res.status(200).json(response);
  }

  static async sendEmailWithTemplate(req, res, next) {
    var request = requestUtils(req);

    logger.info(
      "Emails Controller SEND EMAIL TEMPLATE: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    const email = await EmailHelper.getEmailWithData(req.params.name, req.body);
    

    const response = await SES.sendEmail(
      "henrique.efonseca@gmail.com",
      email.subject,
      email.body
    );

    logger.info(
      "Emails Controller SEND EMAIL TEMPLATE Response: " +
        JSON.stringify(response, null, 2) +
        "\n"
    );

    res.status(200).json(response);

  }
}
