// Import Stripe Service
import StripeService from "../services/stripe.service.js";

import ordersDAO from "../db/ordersDAO.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";



/*
*/
export default class CheckoutController {

static async createPaymentIntent(req, res, next) {

    let payload = {};

    payload.amount = req.body.amount;
    payload.currency = req.body.currency;
    payload.payment_method_types = req.body.payment_method_types;
    payload.description = req.body.description;
    payload.metadata = req.body.metadata;
    payload.statement_descriptor = req.body.statement_descriptor;
    payload.statement_descriptor_suffix = req.body.statement_descriptor_suffix;
    payload.receipt_email = req.body.receipt_email;
    payload.customer = req.body.customer;
    payload.payment_method = req.body.payment_method;
    

    const paymentIntent = await StripeService.createPaymentIntent(payload);

    res.status(200).json(paymentIntent);

    /**
     *   if (paymentIntent.client_secret) {
        // Save the paymentIntentId in the database
        const paymentIntentId = paymentIntent.id;
        const order = await ordersDAO.get_one(req.params.id);
        // Update the order with the paymentIntentId created by Stripe
        order.updateStripePaymentIntent(paymentIntentId);
        await ordersDAO.set(order);

    }
     */

  


    
}

static async confirmPayment (req, res, next) {}

    
    }