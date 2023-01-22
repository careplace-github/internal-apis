// Import Cognito Service
import cognito from "../services/cognito.service.js";

// Import database access objects
import ordersDAO from "../db/orders.dao.js";
import companiesDAO from "../db/companies.dao.js";
import usersDAO from "../db/crmUsers.dao.js";
import relativesDAO from "../db/relatives.dao.js";

import CrudController from "./crud.controller.js";

import * as Error from "../utils/errors/http/index.js";
import AuthHelper from "../helpers/auth/auth.helper.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";

/**
 *  let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CrudController(OrdersDAO);
    await OrdersCRUD.listByCompanyId(req, res, next);
 */

export default class OrdersController {
  static async create(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CrudController(OrdersDAO);
    await OrdersCRUD.create(req, res, next);
  }

  static async retrieve(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CrudController(OrdersDAO);
    await OrdersCRUD.retrieve(req, res, next);
  }

  static async update(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CrudController(OrdersDAO);
    let order = await OrdersDAO.retrieve(req.params.id);
    let updatedOrder = req.body;

    if (updatedOrder.company && order.company !== updatedOrder.company) {
      throw new Error.BadRequest("You cannot change the company of an order.");
    }
    if (updatedOrder.user && order.user !== updatedOrder.user) {
      throw new Error.BadRequest("You cannot change the user of an order.");
    }
    if (updatedOrder.relatives && order.relatives !== updatedOrder.relatives) {
      throw new Error.BadRequest(
        "You cannot change the relatives of an order."
      );
    }
    if (updatedOrder.caregiver && order.caregiver !== updatedOrder.caregiver) {
      throw new Error.BadRequest(
        "You cannot change the caregiver of an order."
      );
    }
    await OrdersCRUD.update(req, res, next);
  }

  static async delete(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CrudController(OrdersDAO);
    await OrdersCRUD.delete(req, res, next);
  }

  static async listOrdersByCompany(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CRUD(OrdersDAO);
    await OrdersCRUD.listByCompanyId(req, res, next);
  }

  static async sendQuote(req, res, next) {}


}
