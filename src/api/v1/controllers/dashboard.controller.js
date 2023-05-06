import crmUsersDAO from "../db/crmUsers.dao.js";
import ordersDAO from "../db/orders.dao.js";
import companiesDAO from "../db/companies.dao.js";
import CRUD from "./crud.controller.js";

// Import logger
import logger from "../../../logs/logger.js";
import stripeHelper from "../helpers/services/stripe.helper.js";

import authHelper from "../helpers/auth/auth.helper.js";

import * as Error from "../utils/errors/http/index.js";

export default class DashboardController {
  static async getDashboard(req, res, next) {
    let accessToken;

    let AuthHelper = new authHelper();

    let CompaniesDAO = new companiesDAO();
    let OrdersDAO = new ordersDAO();

    if (req.headers.authorization) {
      accessToken = req.headers.authorization.split(" ")[1];
    } else {
      throw new Error._401("Missing required access token.");
    }

    let user = await AuthHelper.getUserFromDB(accessToken);

    let companyId = user.company._id;

    if (companyId === null || companyId === undefined) {
      throw new Error._401("Missing required access token.");
    }

    let company = await CompaniesDAO.retrieve(companyId);

    let accountId = company.stripe_information.account_id;

    let pendingOrders = await OrdersDAO.query_list({
      company: companyId,
      status: "new",
    }).then((orders) => {
      return orders.length;
    });

    let StripeHelper = new stripeHelper();

    let numberOfActiveClients;
    let MRR;
    let annualRevenue;

    numberOfActiveClients = await StripeHelper.getConnectedAccountActiveClients(
      accountId
    );

    try {
      MRR = await StripeHelper.getConnectedAccountCurrentMRR(accountId);
    } catch (e) {
      console.log(`2 ${e}`);
    }

    try {
      annualRevenue = await StripeHelper.getConnectAccountTotalRevenueByMonth(
        accountId
      );
    } catch (e) {
      console.log(`3 ${e}`);
    }

    let response = {};

    response.statusCode = 200;
    response.data = {
      pending_orders:
        pendingOrders !== null && pendingOrders !== undefined
          ? pendingOrders
          : 0,
      active_clients:
        numberOfActiveClients !== null && numberOfActiveClients !== undefined
          ? numberOfActiveClients
          : 0,
      MRR: MRR !== null && MRR !== undefined ? MRR : 0,
      annual_revenue:
        annualRevenue !== null && annualRevenue !== undefined
          ? annualRevenue
          : [],
    };

    next(response);
  }
}
