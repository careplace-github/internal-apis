// Import Cognito Service
import CognitoService from '../services/cognito.service.js';

// Import database access objects
import ordersDAO from '../db/orders.dao.js';
import companiesDAO from '../db/companies.dao.js';
import usersDAO from '../db/marketplaceUsers.dao.js';
import relativesDAO from '../db/relatives.dao.js';

import CRUD from './crud.controller.js';

import * as Error from '../utils/errors/http/index.js';
import authHelper from '../helpers/auth/auth.helper.js';

import emailHelper from '../helpers/emails/email.helper.js';
import SES_Service from '../services/ses.service.js';

// Import logger
import logger from '../../../logs/logger.js';
import dateUtils from '../utils/data/date.utils.js';
import authUtils from '../utils/auth/auth.utils.js';
import cognito from '../services/cognito.service.js';

/**
 * Import the JSON Object from /src/assets/data/services.json
 */
import { services } from '../../../assets/data/services.js';

/**
 *  let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CRUD(OrdersDAO);
    await OrdersCRUD.listByCompanyId(req, res, next);
 */

export default class OrdersController {
  static async create(req, res, next) {
    try {
      let AuthHelper = new authHelper();

      let order = req.body;

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._401('Missing required access token.');
      }

      let CompaniesDAO = new companiesDAO();
      let UsersDAO = new usersDAO();
      let OrdersDAO = new ordersDAO();
      let DateUtils = new dateUtils();
      let RelativesDAO = new relativesDAO();

      let cognitoUser = await AuthHelper.getAuthUser(accessToken);

      let cognitoId = cognitoUser.Username;

      let user = await UsersDAO.query_one({ cognito_id: cognitoId });

      let relative = await RelativesDAO.query_one(
        { user: user._id },
        {
          path: 'user',
          model: 'marketplace_users',
        }
      );

      if (relative === null || relative === undefined || relative === '') {
        throw new Error._400('Relative not found');
      }

      if (relative === null || relative === undefined || relative === '') {
        throw new Error._400('Relative not found');
      }

      let company = await CompaniesDAO.query_one({ _id: order.company });

      if (company === null || company === undefined || company === '') {
        throw new Error._400('Company not found');
      }

      order.user = user._id;
      order.status = 'new';

      order.address = {
        street: relative.address.street,
        postal_code: relative.address.postal_code,
        city: relative.address.city,
        state: relative.address.state,
        country: relative.address.country,

        coordinates: relative.address.coordinates,
      };

      let orderCreated = await OrdersDAO.create(order);

      let response = {
        statusCode: 200,
        data: orderCreated,
      };

      next(response);

      let EmailHelper = new emailHelper();
      let SES = new SES_Service();

      /**
       * From 'services' array, get the services that are in the order
       */
      let orderServices = [];

      for (let i = 0; i < order.services.length; i++) {
        let service = services.find((service) => {
          if (service._id == order.services[i]) {
            return service;
          }
        });

        orderServices.push(service);
      }

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      orderServices = orderServices
        .map((service) => {
          return service.name;
        })
        .join(', ');

      let schedule = await DateUtils.getScheduleRecurrencyText(order.schedule_information.schedule);

      let birthdate = await DateUtils.convertDateToReadableString(relative.birthdate);

      let orderStart = await DateUtils.convertDateToReadableString2(
        order.schedule_information.start_date
      );

      let userEmailPayload = {
        name: user.name,
        company: company.business_profile.name,
        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        relativeName: relative.name,
        relativeBirthdate: birthdate,
        relativeMedicalInformation:
          relative.medical_information !== undefined && relative.medical_information !== null
            ? relative.medical_information
            : 'n/a',

        relativeStreet: relative.address.street,
        relativeCity: relative.address.city,
        relativePostalCode: relative.address.postal_code,
        relativeCountry: relative.address.country,
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_new_order',
        userEmailPayload
      );

      await SES.sendEmail(
        [user.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );
      /**
       * @todo Send the email in BCC for each employee of the company that has one of the roles ['admin', 'manager', 'employee'] and that has the 'email_notifications' field set to true
       */

      let companyEmailPayload = {
        name: company.legal_information.director.name,
        company: company.business_profile.name,

        link: `https://www.sales.careplace.pt/orders/${orderCreated._id}`,
      };

      let crmNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'crm_new_order',
        companyEmailPayload
      );

      await SES.sendEmail(
        [company.business_profile.email],
        crmNewOrderEmail.subject,
        crmNewOrderEmail.htmlBody
      );
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  static async retrieve(req, res, next) {
    try {
      let response = {};
      let accessToken;
      let documents;

      const orderId = req.params.id;

      let AuthHelper = new authHelper();

      let user;

      let OrdersDAO = new ordersDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];

        user = await AuthHelper.getUserFromDB(accessToken);
      } else {
        throw new Error._401('No Authorization header found.');
      }

      try {
        documents = await OrdersDAO.retrieve(
          orderId,

          // Populate the fields relative and caregiver
          [
            {
              path: 'relative',
            },
            {
              path: 'caregiver',
            },
            {
              path: 'services',
            },
            {
              path: 'company',
            },
          ]
        );
      } catch (err) {
        switch (err.type) {
          default:
            throw new Error._500(err.message);
        }
      }

      response = {
        statusCode: 200,
        data: documents,
      };

      next(response);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  static async update(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CRUD(OrdersDAO);
    let order = await OrdersDAO.retrieve(req.params.id);
    let updatedOrder = req.body;

    if (updatedOrder.company && order.company !== updatedOrder.company) {
      throw new Error.BadRequest('You cannot change the company of an order.');
    }
    if (updatedOrder.user && order.user !== updatedOrder.user) {
      throw new Error.BadRequest('You cannot change the user of an order.');
    }
    if (updatedOrder.relatives && order.relatives !== updatedOrder.relatives) {
      throw new Error.BadRequest('You cannot change the relatives of an order.');
    }
    if (updatedOrder.caregiver && order.caregiver !== updatedOrder.caregiver) {
      throw new Error.BadRequest('You cannot change the caregiver of an order.');
    }
    await OrdersCRUD.update(req, res, next);
  }

  static async delete(req, res, next) {
    let OrdersDAO = new ordersDAO();
    let OrdersCRUD = new CRUD(OrdersDAO);
    await OrdersCRUD.delete(req, res, next);
  }

  static async listOrdersByUser(req, res, next) {
    try {
      let response = {};
      let accessToken;
      let documents;

      let AuthHelper = new authHelper();

      let user;

      let OrdersDAO = new ordersDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];

        user = await AuthHelper.getUserFromDB(accessToken);
      } else {
        throw new Error._401('No Authorization header found.');
      }

      try {
        documents = await OrdersDAO.query_list(
          {
            user: user._id,
          },
          null,
          null,
          null,
          // Populate the fields relative and caregiver
          [
            {
              path: 'relative',
            },
            {
              path: 'caregiver',
            },
            {
              path: 'services',
            },
            {
              path: 'company',
            },
          ]
        );
      } catch (err) {
        switch (err.type) {
          default:
            throw new Error._500(err.message);
        }
      }

      response = {
        statusCode: 200,
        data: documents,
      };

      next(response);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  static async listOrdersByCompany(req, res, next) {
    try {
      let response = {};
      let accessToken;
      let companyId;
      let documents;

      let AuthUtils = new authUtils();
      let AuthHelper = new authHelper();
      let Cognito = new cognito();

      let OrdersDAO = new ordersDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._401('No Authorization header found.');
      }

      try {
        let user = await AuthHelper.getUserFromDB(accessToken);
        companyId = user.company;
      } catch (err) {
        console.log(`ERROR 4: ${err}`);
        switch (err.type) {
          default:
            throw new Error._500(err.message);
        }
      }

      try {
        documents = await OrdersDAO.query_list(
          {
            company: { $eq: companyId },
          },

          null,
          null,
          null,

          [
            {
              path: 'user',
              model: 'marketplace_users',
              select: '-_id -stripe_information -settings -cognito_id -createdAt -updatedAt -__v',
            },
            {
              path: 'relative',
              model: 'Relative',
              select: '-_id -createdAt -updatedAt -user -__v',
            },
            {
              path: 'caregiver',
              model: 'Caregiver',
              select: '-_id -createdAt -updatedAt -cognito_id -stripe_information -settings -__v',
            },
            {
              path: 'services',
              model: 'Service',
              select: '-_id -createdAt -updatedAt -__v',
            },
          ]
        );
      } catch (err) {
        console.log(`ERROR 5: ${err}`);
        switch (err.type) {
          default:
            throw new Error._500(err.message);
        }
      }

      response.statusCode = 200;
      response.data = documents;

      next(response);
    } catch (err) {
      console.log(`EROOR: ${err}`);
      next(err);
    }
  }

  static async acceptOrder(req, res, next) {
    try {
      let AuthHelper = new authHelper();
      let OrdersDAO = new ordersDAO();
      let CompaniesDAO = new companiesDAO();
      let UsersDAO = new usersDAO();
      let DateUtils = new dateUtils();

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._401('Missing required access token.');
      }

      let companyId = await AuthHelper.getUserAttributes(accessToken).then((data) => {
        let companyId = data.find((item) => {
          console.log(item);
          if (item.Name === 'custom:company') {
            return item.Value;
          }
        });

        return companyId.Value;
      });

      let order = await OrdersDAO.retrieve(req.params.id);

      if (companyId != order.company) {
        throw new Error._403('You are not authorized to accept this order.');
      }

      if (order.status != 'pending') {
        throw new Error._400('You cannot accept this order.');
      }

      order.status = 'accepted';

      await OrdersDAO.update(order);

      let response = {
        statusCode: 200,
        data: order,
      };

      next(response);

      let EmailHelper = new emailHelper();
      let SES = new SES_Service();

      /**
       * From 'services' array, get the services that are in the order
       */
      let orderServices = [];

      for (let i = 0; i < order.services.length; i++) {
        let service = services.find((service) => {
          if (service._id == order.services[i]) {
            return service;
          }
        });

        orderServices.push(service);
      }

      let user = await UsersDAO.query_one(
        { _id: order.user },
        {
          path: 'relatives',
          model: 'Relative',
        }
      );

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      orderServices = orderServices
        .map((service) => {
          return service.name;
        })
        .join(', ');

      // From the users.relatives array, get the relative that matches the relative id in the order
      let relative = user.relatives.find((relative) => {
        if (relative._id.toString() == order.relative.toString()) {
          return relative;
        }
      });

      logger.info(`User: ${relative}`);

      let company = await CompaniesDAO.query_one(
        { _id: order.company },
        {
          path: 'legal_information',
          populate: {
            path: 'director',
            model: 'crm_users',
          },
        }
      );

      let schedule = await DateUtils.getScheduleRecurrencyText(order.schedule_information.schedule);

      let birthdate = await DateUtils.convertDateToReadableString(relative.birthdate);

      let orderStart = await DateUtils.convertDateToReadableString2(
        order.schedule_information.start_date
      );

      let userEmailPayload = {
        name: user.name,
        company: company.business_profile.name,

        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        relativeName: relative.name,
        relativeBirthdate: birthdate,
        relativeMedicalInformation:
          relative.medical_information !== undefined && relative.medical_information !== null
            ? relative.medical_information
            : 'n/a',

        relativeStreet: relative.address.street,
        relativeCity: relative.address.city,
        relativePostalCode: relative.address.postal_code,
        relativeCountry: relative.address.country,
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_order_accepted',
        userEmailPayload
      );

      await SES.sendEmail(
        [user.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );
      /**
       * @todo Send the email in BCC for each employee of the company that has one of the roles ['admin', 'manager', 'employee'] and that has the 'email_notifications' field set to true
       */

      let companyEmailPayload = {
        name: company.legal_information.director.name,
        company: company.business_profile.name,

        userName: user.name,
        userPhone: user.phone,

        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        relativeName: relative.name,
        relativeBirthdate: birthdate,
        relativeMedicalInformation:
          relative.medical_information !== undefined && relative.medical_information !== null
            ? relative.medical_information
            : 'n/a',

        relativeStreet: relative.address.street,
        relativeCity: relative.address.city,
        relativePostalCode: relative.address.postal_code,
        relativeCountry: relative.address.country,

        link: `https://www.sales.careplace.pt/orders/${order._id}`,
      };

      let crmNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'crm_order_accepted',
        companyEmailPayload
      );

      await SES.sendEmail(
        [company.business_profile.email],
        crmNewOrderEmail.subject,
        crmNewOrderEmail.htmlBody
      );
    } catch (error) {
      logger.error(error.stack);
      next(error);
    }
  }

  static async declineOrder(req, res, next) {}

  static async sendQuote(req, res, next) {
    try {
      let AuthHelper = new authHelper();
      let OrdersDAO = new ordersDAO();
      let CompaniesDAO = new companiesDAO();
      let UsersDAO = new usersDAO();
      let DateUtils = new dateUtils();

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._401('Missing required access token.');
      }

      let companyId = await AuthHelper.getUserAttributes(accessToken).then((data) => {
        let companyId = data.find((item) => {
          console.log(item);
          if (item.Name === 'custom:company') {
            return item.Value;
          }
        });

        return companyId.Value;
      });

      let order = await OrdersDAO.query_one({ _id: req.params.id }, [
        {
          path: 'relative',
          model: 'Relative',
        },
        {
          path: 'company',
          model: 'Company',
          populate: {
            path: 'legal_information',
            populate: {
              path: 'director',
              model: 'crm_users',
            },
          },
        },
        {
          path: 'services',
          model: 'Service',
        },
        {
          path: 'user',
          model: 'marketplace_users',
        },
      ]);

      if (companyId != order.company._id) {
        throw new Error._403('You are not authorized to send a quote for this order.');
      }

      /**
       *  if(order.status != "pending"){
        throw new Error._400("You cannot send a quote for this order.");
      }
       */

      let response = {
        statusCode: 200,
        data: order,
      };

      next(response);

      let EmailHelper = new emailHelper();
      let SES = new SES_Service();

      /**
       * From 'services' array, get the services that are in the order
       */
      let orderServices = [];

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      orderServices = order.services
        .map((service) => {
          return service.name;
        })
        .join(', ');

      let schedule = await DateUtils.getScheduleRecurrencyText(order.schedule_information.schedule);

      let birthdate = await DateUtils.convertDateToReadableString(order.relative.birthdate);

      let orderStart = await DateUtils.convertDateToReadableString2(
        order.schedule_information.start_date
      );

      let userEmailPayload = {
        name: order.user.name,
        company: order.company.business_profile.name,

        link: `https://www.careplace.pt/checkout/orders/${order._id}`,

        subTotal: (order.order_total / 1.23).toFixed(2),
        taxAmount: (order.order_total - order.order_total / 1.23).toFixed(2),
        total: order.order_total.toFixed(2),

        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        relativeName: order.relative.name,
        relativeBirthdate: birthdate,
        relativeMedicalInformation:
          order.relative.medical_information !== undefined &&
          order.relative.medical_information !== null
            ? relative.medical_information
            : 'n/a',

        relativeStreet: order.relative.address.street,
        relativeCity: order.relative.address.city,
        relativePostalCode: order.relative.address.postal_code,
        relativeCountry: order.relative.address.country,
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_quote_sent',
        userEmailPayload
      );

      await SES.sendEmail(
        [order.user.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );
      /**
       * @todo Send the email in BCC for each employee of the company that has one of the roles ['admin', 'manager', 'employee'] and that has the 'email_notifications' field set to true
       */

      let companyEmailPayload = {
        name: order.company.legal_information.director.name,
        company: order.company.business_profile.name,

        link: `https://www.sales.careplace.pt/orders/${order._id}`,

        subTotal: (order.order_total / 1.23).toFixed(2),
        taxAmount: (order.order_total - order.order_total / 1.23).toFixed(2),
        total: order.order_total.toFixed(2),

        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        relativeName: order.relative.name,
        relativeBirthdate: birthdate,
        relativeMedicalInformation:
          order.relative.medical_information !== undefined &&
          order.relative.medical_information !== null
            ? relative.medical_information
            : 'n/a',

        relativeStreet: order.relative.address.street,
        relativeCity: order.relative.address.city,
        relativePostalCode: order.relative.address.postal_code,
        relativeCountry: order.relative.address.country,

        userName: order.user.name,
        userPhone: order.user.phone,
      };

      let crmNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'crm_quote_sent',
        companyEmailPayload
      );

      await SES.sendEmail(
        [order.company.business_profile.email],
        crmNewOrderEmail.subject,
        crmNewOrderEmail.htmlBody
      );
    } catch (error) {
      logger.error(error.stack);
      next(error);
    }
  }
}
