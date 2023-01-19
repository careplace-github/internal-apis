// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";
import CRUD from "./crud.controller.js";
import * as Error from "../utils/errors/http/index.js";

import servicesDAO from "../db/services.dao.js";

export default class ServicesController {
  static async listServices(req, res, next) {
    let ServicesDAO = new servicesDAO();

    try {
      var services = await ServicesDAO.query_list();
    } catch (err) {
      throw new Error._500(err);
    }

    res.status(200).json(services);
  }
}
