import mongoose from "mongoose";
import mongodb from "mongodb";

// Import the user schema
//import User from "../models/auth/user.model.js";
import orderSchema from "../models/app/orders/orders.model.js";

// Import logger
import logger from "../../../logs/logger.js";

let Order;
const ObjectId = mongodb.ObjectId;

export default class ordersDAO {
  /**
   * @description Creates the connection to the MongoDB database.
   * @param {mongoose} connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectCollection(conn) {
    try {
      Order = await conn.model("order", orderSchema);
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in ordersDAO: ${error}`
      );
      return { error: error };
    }
  }

  static async add(order) {
    try {
      logger.info("ORDERS-DAO ADD STARTED: ");

      logger.info(JSON.stringify(order, null, 2) + "\n");

      const newOrder = await Order.create({
        _id: new ObjectId(),
        company: order.company,
        caregiver: order.caregiver,
        client: order.client,
        companyAccepted: order.companyAccepted,
        clientAccepted: order.clientAccepted,
        services: order.services,
        scheduleInformation: order.scheduleInformation,
        paymentInformation: order.paymentInformation,
        orderStatus: order.orderStatus,
        billingAddress: order.billingAddress,
      });

      //await newOrder.save();

      const events = await newOrder.createEvents();

     // logger.info("EVENTS: " + JSON.stringify(events, null, 2) + "\n");

      return events;
    } catch (error) {
      logger.error(`Unable to add order: ${error}`);
      return { error: error };
    }
  }


 /**
   * @description Updates the order information in the database.
   * @param {*} order - Order object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async set(order) {
    
    try {
      logger.info("ORDERS-DAO SET STARTED: ");

      logger.info(JSON.stringify(order, null, 2) + "\n");

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            company: order.company,
            caregiver: order.caregiver,
            client: order.client,
            companyAccepted: order.companyAccepted,
            clientAccepted: order.clientAccepted,
            services: order.services,
            scheduleInformation: order.scheduleInformation,
            paymentInformation: order.paymentInformation,
            orderStatus: order.orderStatus,
            billingAddress: order.billingAddress,
          },
        },
        { new: true }
      );

      return updatedOrder;
    } catch (error) {
      logger.error(`Unable to update order: ${error}`);
      return { error: error };
    }

  }

}
