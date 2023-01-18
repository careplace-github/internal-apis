import logger from "../../../logs/logger.js";
import * as Error from "../helpers/errors/errors.helper.js";

export default class CRUD_Methods {
  /**
   * Constructur
   */

  constructor(dao) {
    this.DAO = dao;
  }

  async create(req, res, next) {
    try {
      let response = {};

      let document = req.body;

      let documentAdded = await this.DAO.add(document);

      response.statusCode = 201;
      response.data = documentAdded;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  async retrieve(req, res, next) {}

  async update(req, res, next) {}

  async delete(req, res, next) {}
}
