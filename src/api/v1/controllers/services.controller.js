// Import logger
import logger from '../../../logs/logger';
import CRUD from './crud.controller';
import * as Error from '../utils/errors/http/index';

import servicesDAO from '../db/services.dao';

export default class ServicesController {
  static async listServices(req, res, next) {
    let ServicesDAO = new servicesDAO();

    try {
      var services = await ServicesDAO.queryList();
    } catch (err) {
      throw new Error._500(err);
    }

    res.status(200).json(services);
  }

  static async create(req, res, next) {}

  static async retrieve(req, res, next) {}

  static async update(req, res, next) {}
}
