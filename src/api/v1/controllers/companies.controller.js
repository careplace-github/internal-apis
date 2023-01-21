import crmUsersDAO from "../db/crmUsers.dao.js";
import ordersDAO from "../db/orders.dao.js";
import CRUD from "./crud.controller.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";
import StripeService from "../services/stripe.service.js";
import stripeHelper from "../helpers/services/stripe.helper.js";

import * as Errors from "../utils/errors/http/index.js";
import * as LayerErrors from "../utils/errors/layer/index.js";

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

  static async getDashboard(req, res, next) {
    const { accountId } = req.params.id;

    let companyId = "63a204a3973d8aadd5a664b0";

    let OrdersDAO = new ordersDAO();

    let pendingOrders = await OrdersDAO.query_list({
      companyId: companyId,
      status: "pending",
    }).then((orders) => {
    
      return orders.length;
    });

    console.log(`Length of pending orders: ${pendingOrders}`)

    let StripeHelper = new stripeHelper();

    let numberOfActiveClients =
      await StripeHelper.getConnectedAccountActiveSubscriptions(accountId).then(
        (subscriptions) => {
          
          return subscriptions.length;
        }
      );

    let MRR = await StripeHelper.getConnectedAccountCurrentMRR(accountId);

    let annualRevenue = await StripeHelper.getConnectAccountTotalRevenueByMonth(
      accountId
    );

    let response = {};

    response.statusCode = 200;
    response.data = {
      pendingOrders: pendingOrders !== null && pendingOrders !== undefined ? pendingOrders : 0,
      activeClients: numberOfActiveClients !== null && numberOfActiveClients !== undefined ? numberOfActiveClients : 0,
      MRR: MRR !== null && MRR !== undefined ? MRR : 0,
      annualRevenue: annualRevenue !== null && annualRevenue !== undefined ? annualRevenue : [],
    };

    next(response);
  }

  static async listCompanies(req, res, next) {}

  /**
   * @deprecated
   */
}
