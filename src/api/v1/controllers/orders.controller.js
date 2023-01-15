// Import Cognito Service
import Cognito from "../services/cognito.service.js";

// Import database access objects
import ordersDAO from "../db/orders.dao.js";
import companiesDAO from "../db/companies.dao.js";




// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";
//import { CognitoIdentityServiceProvider } from "aws-sdk";

export default class OrdersController {


    static async index(req, res, next) {}

    static async create(req, res, next) {


    var request = requestUtils(req);

    logger.info("ORDERS-CONTROLLER CREATE STARTED: " + JSON.stringify(request, null, 2) + "\n");

    const order = req.body;

    let newOrder = await ordersDAO.add(order);

    res.status(200).json(newOrder);

    

    }


    static async show(req, res, next) {}

    static async update(req, res, next) {}

    static async destroy(req, res, next) {}


}