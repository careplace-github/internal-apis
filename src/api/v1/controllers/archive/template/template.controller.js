// Import services
// -> import someService from "../services/something.service.js";
// Import DB
import templatesDAO from "../../../db/template/templatesDAO.js";
// Immport helpers
// -> import someHelper from "../helpers/something.helper.js";
// Import logger
import logger from "../../../logs/logger.js";
// Import utils
import requestUtils from "../utils/request.utils.js";

/**
 * Template Controller Class for the API endpoints `/templates`.
 * To use this controller one must `import TemplateController from "./controllers/template/template.controller.js";`
 * and then use the methods as `TemplateController.index` or `TemplateController.create`.
 */
export default class TemplateController {
  /**
   * Template Controller Class for the API Template Controller methods.
   * @param {import("http").ClientRequest} req - HTTP Request.
   * @param {import("http").ServerResponse} res - HTTP Response.
   * @returns {res} Returns the `res` with a JSON object with the response.
   */
  static async index(req, res) {
    try {
      var request = requestUtils(req);

      let response;
      let templates;

      let filters = {};
      let options = {};
      let page = req.query.page != null ? req.query.page : null;
      let documentsPerPage =
        req.query.documentsPerPage != null && page != null
          ? req.query.documentsPerPage
          : null;

      // Log the request
      logger.info(
        "TEMPLATE_CONTROLLER INDEX METHOD STARTED: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
      if (req.query.sortBy) {
        /**
         * If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
         * Otherwise, we will by default sort the results by ascending order.
         */
        options.sort = {
          [req.query.sortBy]: req.query.sortOrder == "desc" ? -1 : 1, // 1 = ascending, -1 = descending
        };
      }

      /**
       * If the query has any parameters, then we will filter the results by the query parameters.
       * We do this instead of doing ```filters = req.query``` because we don't want to filter by the sortBy and sortOrder query parameters or any other parameter like this.
       * This also helps in security because we can filter out any unwanted parameters.
       */
      if (req.query) {
        // If the query has a someAttribute parameter, then we will filter the results by the someAttribute query parameter.
        if (req.query.someAttribute) {
          filters.someAttribute = req.query.someAttribute;
        }
      }

      templates = await templatesDAO.get_list(
        filters,
        options,
        page,
        documentsPerPage
      );

      // Error getting the list of documents from the database
      if (templates.error) {
        switch (templates.error) {
          case "NOT_FOUND":
            // Add the error to the response
            response.error = "No templates found.";
            response.statusCode = 404;

            logger.warn(
              "TEMPLATE_CONTROLLER INDEX METHOD RESPONSE: " +
                JSON.stringify(response, null, 2) +
                "\n"
            );

            // Return the response
            return res.status(404).json(response);

          // Add the error to the response
          default:
            response.error = templates.error;
            response.statusCode = 500;

            // Log the response
            logger.error(
              "TEMPLATE_CONTROLLER CREATE RESPONSE: " +
                JSON.stringify(response, null, 2) +
                "\n"
            );
        }
      }

      // If there is  no error, then we will add the templates to the response
      response = templates;

      response.statusCode = 200;

      // Log the response
      logger.info(
        "TEMPLATE_CONTROLLER INDEX METHOD RESPONSE: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      // Return the response
      return res.status(200).json(response.templates);
    } catch (error) {
      // Internal error
      logger.error("TEMPLATE_CONTROLLER INDEX METHOD INTERNAL ERROR: " + error);

      return res.status(500).json({
        error: error,
      });
    }
  }

  static async create(req, res) {
    try {
      var request = requestUtils(req);

      let response;
      let mongodbResponse;

      // Log the request
      logger.info(
        "TEMPLATE_CONTROLLER CREATE STARTED: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      mongodbResponse = await templateDAO.add(request);

      // Error adding a new document to the database
      if (mongodbResponse.error) {
        // Add the error to the response
        response.error = mongodbResponse.error;

        // Log the response
        logger.info(
          "TEMPLATE_CONTROLLER CREATE RESPONSE: " +
            JSON.stringify(response, null, 2) +
            "\n"
        );

        // Return the response with the error
        return res.status(400).json({
          error: mongodbResponse.error,
        });
      }

      response = mongodbResponse;

      // Log the response
      logger.info(
        "TEMPLATE_CONTROLLER CREATE RESPONSE: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      // Return the response
      return res.status(200).json({ response });
    } catch (error) {
      // Internal error
      logger.error("TEMPLATE_CONTROLLER INTERNAL ERROR: " + error);

      return res.status(500).json({
        error: error,
      });
    }
  }

  static async update(req, res) {}

  static async show(req, res) {}

  static async destroy(req, res) {}
}
