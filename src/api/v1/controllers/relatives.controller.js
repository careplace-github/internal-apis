// Import logger
import logger from "../../../logs/logger.js";

import authHelper from "../helpers/auth/auth.helper.js";
import marketplaceUsersDAO from "../db/marketplaceUsers.dao.js";
import relativesDAO from "../db/relatives.dao.js";
import CRUD from "./crud.controller.js";

import * as Error from "../utils/errors/http/index.js";

export default class FilesController {
  static async create(req, res, next) {
    try {
      let response = {};
      let relative = req.body;
      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers["authorization"].split(" ")[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      relative.user = user._id;

      let relativeCreated = await RelativesDAO.create(relative);

      response.statusCode = 200;
      response.data = relativeCreated;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async retrieve(req, res, next) {
    try {
      let response = {};
      let relativeId = req.params.id;
      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.retrieve(relativeId);

      if (relative.user.toString() !== user._id.toString()) {
        throw new Error._403("You are not allowed to access this resource");
      }

      response.statusCode = 200;
      response.data = relative;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      let response = {};
      let relativeId = req.params.id;

      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.retrieve(relativeId);

      relative = {
        ...relative,
        ...req.body,
      };

      if (relative.user.toString() !== user._id.toString()) {
        throw new Error._403("You are not allowed to access this resource");
      }

      let relativeUpdated = await RelativesDAO.update(relativeId, relative);

      response.statusCode = 200;
      response.data = relativeUpdated;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let response = {};
      let relativeId = req.params.id;
      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.retrieve(relativeId);

      if (relative.user.toString() !== user._id.toString()) {
        throw new Error._403("You are not allowed to access this resource");
      }

      let relativeDeleted = await RelativesDAO.delete(relativeId);

      response.statusCode = 200;
      response.data = relativeDeleted;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async listRelatives(req, res, next) {
    try {
      let response = {};
      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers["authorization"].split(" ")[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relatives = await RelativesDAO.query_list({
        user: user._id,
      });

      response.statusCode = 200;
      response.data = relatives;

      next(response);
    } catch (error) {
      next(error);
    }
  }
}
