import crmUsersDAO from "../db/crmUsers.dao.js";
import ordersDAO from "../db/orders.dao.js";
import companiesDAO from "../db/companies.dao.js";
import CRUD from "./crud.controller.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";
import StripeService from "../services/stripe.service.js";
import stripeHelper from "../helpers/services/stripe.helper.js";

import authHelper from "../helpers/auth/auth.helper.js";

import * as Error from "../utils/errors/http/index.js";
import * as LayerError from "../utils/errors/layer/index.js";
import { model } from "mongoose";

export default class CompaniesController {
  static async create(req, res, next) {
    let CompaniesDAO = new companiesDAO();
    let CompaniesCRUD = new CRUD(CompaniesDAO);

    await CompaniesCRUD.create(req, res, next);
  }

  static async retrieve(req, res, next) {
    let CompaniesDAO = new companiesDAO();
    let CompaniesCRUD = new CRUD(CompaniesDAO);

    await CompaniesCRUD.retrieve(req, res, next);
  }

  static async update(req, res, next) {
    let CompaniesDAO = new companiesDAO();
    let CompaniesCRUD = new CRUD(CompaniesDAO);

    await CompaniesCRUD.update(req, res, next);
  }

  static async searchCompanies(req, res, next) {
    let filters = {};
    let options = {};
    let page = req.query.page ? req.query.page : 1;
    let documentsPerPage = req.query.documentsPerPage
      ? req.query.documentsPerPage
      : 10;

    // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
    if (req.query.sortBy) {
      // If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
      // Otherwise, we will by default sort the results by ascending order.
      options.sort = {
        [req.query.sortBy]: req.query.sortOrder === "desc" ? -1 : 1, // 1 = ascending, -1 = descending
      };
    }

    let CompaniesDAO = new companiesDAO();
    let companies = await CompaniesDAO.query_list(
      filters,
      options,
      page,
      documentsPerPage,
      null,
      "-plan -legal_information -team -stripe_information -billing_address"
    );

    let response = {
      data: companies,
      statusCode: 200,
    };

    next(response);
  }

}
