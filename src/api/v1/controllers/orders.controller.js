// Import Cognito Service
import Cognito from "../services/cognito.service.js";

// Import database access objects
import OrdersDAO from "../db/orders.dao.js";
import CompaniesDAO from "../db/companies.dao.js";
import UsersDAO from "../db/users.dao.js";
import RelativesDAO from "../db/relatives.dao.js";

// Import Helpers
import AuthHelper from "../helpers/auth.helper.js";


// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";


export default class OrdersController {
  static async index(req, res, next) {}

  static async create(req, res, next) {
    try {
      let token;
      let response = {};

      let order = req.body;

      let companiesDAO = new CompaniesDAO();
      let usersDAO = new UsersDAO();
      let relativesDAO = new RelativesDAO();
      let ordersDAO = new OrdersDAO();

      if (req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._401("No token provided.");
      }

      try {
        let companyExists = await companiesDAO.get_one(order.company);
      } catch (error) {
        if (err.type === "NOT_FOUND" || err.name === "CastError") {
          throw new Error._400(
            "Company does not exist. Need a valid Comapny to create an Order."
          );
        }
      }

      try {
        let customerExists = await usersDAO.get_one(order.customer);
      } catch (error) {
        if (err.type === "NOT_FOUND" || err.name === "CastError") {
          throw new Error._400(
            "User does not exist. Need a valid Customer User to create an Order."
          );
        }
      }

      try {
        let relativeExists = await relativesDAO.get_one(order.relative);
      } catch (error) {
        if (err.type === "NOT_FOUND" || err.name === "CastError") {
          throw new Error._400(
            "User does not exist. Need a valid Relative User to create an Order."
          );
        }
      }

      // Get authId from token
      let authId = await AuthHelper.getAuthId(token, "cognito");

      // Get user that cognitoId matches the authId
      let user = await usersDAO.get_list({ cognito_id: { $eq: authId } });

      if (user.role === "user") {
        // The user._id has to be the same as the order.customer or the order.client to create an order
        // So we need to check if the user._id is the same as the order.customer or the order.client
        // If it is not the same, then we need to throw an error
        // If it is the same, then we can create the order

        if (user._id !== order.customer && user._id !== order.relative) {
            throw new Error._403(
                "You are not authorized to create an order."
            );
        }

      }
      else {
        // Verify if the user belongs to the order.company and if the user is a company admin
        // If the user is not a company admin, then we need to throw an error
        // If the user is a company admin, then we can create the order

        if (user.company !== order.company) {
            throw new Error._403(
                "You are not authorized to create an order."
            );
        }

        if (user.role !== "company_owner" && user.role !== "company_admin") {
            throw new Error._403(
                "You are not authorized to create an order."
            );
        }

      }

      /**
       * Stripe Validations
       */

      let stripe = new Stripe();

      let card = new Card();

      stripe.createCardToken();

      // Verify if the company.stripe_information.account_id exists

      // Verify if the user.stripe_information.customer_id exists

     

    } catch (error) {}
  }

  static async show(req, res, next) {}

  static async update(req, res, next) {}

  static async destroy(req, res, next) {}
}
