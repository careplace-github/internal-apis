import CognitoService from "../services/cognito.service.js";
import companiesDAO from "../db/companies.dao.js";

import crmUsersDAO from "../db/crmUsers.dao.js";
import ordersDAO from "../db/orders.dao.js";
import CRUD from "./crud.controller.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";

export default class CompaniesController {
  static async retrieve(req, res, next) {}
  static async getUsers(req, res, next) {
    const CrmUsersDAO = new crmUsersDAO();
    const CrmUsersCRUD = new CRUD(CrmUsersDAO);

    await CrmUsersCRUD.listByCompanyId(req, res, next);
  }

  static async getOrders(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CRUD(OrdersDAO);
    await OrdersCRUD.listByCompanyId(req, res, next);
  }

  static async listCompanies(req, res, next) {}

  /**
   * @deprecated
   */
}
