// Import Cognito Service
import CognitoService from '../services/cognito.service';

// Import database access objects
import ordersDAO from '../db/orders.dao';
import companiesDAO from '../db/companies.dao';
import usersDAO from '../db/marketplaceUsers.dao';
import relativesDAO from '../db/relatives.dao';
import crmUsersDAO from '../db/crmUsers.dao';
import caregiversDAO from '../db/caregivers.dao';
import eventsSeriesDAO from '../db/eventsSeries.dao';

import CRUD from './crud.controller';

import { HTTPError } from '@api/v1/utils/errors/http';
import authHelper from '../helpers/auth/auth.helper';

import emailHelper from '../helpers/emails/email.helper';
import SES_Service from '../services/ses.service';

// Import logger
import logger from '../../../logs/logger';
import dateUtils from '../utils/data/date.utils';
import authUtils from '../utils/auth/auth.utils';
import cognito from '../services/cognito.service';

/**
 * Import the JSON Object from /src/assets/data/serviceson
 */
import { services } from '../../../assets/data/services';
import RelativesDAO from '../db/relatives.dao';

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
        throw new HTTPError._401('Missing required access token.');
      }

      let CompaniesDAO = new companiesDAO();
      let UsersDAO = new usersDAO();
      let OrdersDAO = new ordersDAO();
      let DateUtils = new dateUtils();
      let RelativesDAO = new relativesDAO();
      let CRMUsersDAO = new crmUsersDAO();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.queryOne(
        { user: user._id },
        {
          path: 'user',
          model: 'marketplace_user',
        }
      );

      if (relative === null || relative === undefined || relative === '') {
        throw new HTTPError._400('Relative not found');
      }

      if (relative === null || relative === undefined || relative === '') {
        throw new HTTPError._400('Relative not found');
      }

      let company = await CompaniesDAO.queryOne({ _id: order.company });

      if (company === null || company === undefined || company === '') {
        throw new HTTPError._400('Company not found');
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

      const crmUsers = (
        await CRMUsersDAO.queryList({
          company: { $eq: orderCreated.company },
        })
      ).data;

      // Only send email to crm users that have the 'orders_emails' permission
      crmUsers = crmUsers.filter((user) => {
        return user?.permissions?.includes('orders_emails');
      });

      const crmEmails = crmUsers.map((user) => {
        return user.email;
      });

      for (let i = 0; i < crmEmails.length; i++) {
        let companyEmailPayload = {
          name: crmUsers[i].name,
          company: company.business_profile.name,

          link: `https://www.sales.careplace.pt/orders/${orderCreated._id}`,
        };

        let crmNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
          'crm_new_order',
          companyEmailPayload
        );

        await SES.sendEmail(crmEmails, crmNewOrderEmail.subject, crmNewOrderEmail.htmlBody);
      }
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
        throw new HTTPError._401('No Authorization header found.');
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
            {
              path: 'user',
              model: 'marketplace_user',
              select: 'name email phone address -_id',
            },
          ]
        );
      } catch (err) {
        switch (err.type) {
          default:
            throw new HTTPError._500(err.message);
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
      throw new HTTPError.BadRequest('You cannot change the company of an order.');
    }
    if (updatedOrder.user && order.user !== updatedOrder.user) {
      throw new HTTPError.BadRequest('You cannot change the user of an order.');
    }
    if (updatedOrder.relatives && order.relatives !== updatedOrder.relatives) {
      throw new HTTPError.BadRequest('You cannot change the relatives of an order.');
    }
    if (updatedOrder.caregiver && order.caregiver !== updatedOrder.caregiver) {
      throw new HTTPError.BadRequest('You cannot change the caregiver of an order.');
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
        throw new HTTPError._401('No Authorization header found.');
      }

      try {
        documents = await OrdersDAO.queryList(
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
            throw new HTTPError._500(err.message);
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
        throw new HTTPError._401('No Authorization header found.');
      }

      try {
        let user = await AuthHelper.getUserFromDB(accessToken);
        companyId = user.company;
      } catch (err) {
        console.log(`ERROR 4: ${err}`);
        switch (err.type) {
          default:
            throw new HTTPError._500(err.message);
        }
      }

      try {
        documents = await OrdersDAO.queryList(
          {
            company: { $eq: companyId },
          },

          null,
          null,
          null,

          [
            {
              path: 'user',
              model: 'marketplace_user',
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
            throw new HTTPError._500(err.message);
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
      let CRMUsersDAO = new crmUsersDAO();
      let RelativesDAO = new relativesDAO();
      let CaregiversDAO = new caregiversDAO();
      let EventsSeriesDAO = new eventsSeriesDAO();
      let DateUtils = new dateUtils();

      let caregiver = req.body.caregiver;

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._401('Missing required access token.');
      }

      if (!caregiver) {
        throw new HTTPError._400('Missing caregiver.');
      }

      let caregiverExists = await CaregiversDAO.retrieve(caregiver);

      if (!caregiverExists) {
        throw new HTTPError._400('Caregiver does not exist.');
      }

      let companyId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        return user.company._id;
      });

      let order = await OrdersDAO.retrieve(req.params.id);

      if (companyId.toString() !== order.company.toString()) {
        throw new HTTPError._403('You are not authorized to accept this order.');
      }

      if (order.status !== 'new') {
        throw new HTTPError._400('You cannot accept this order.');
      }

      order.status = 'accepted';
      order.caregiver = caregiver;

      await OrdersDAO.update(order);

      let response = {
        statusCode: 200,
        data: order,
      };

      next(response);

      // From the users.relatives array, get the relative that matches the relative id in the order
      let relative = await RelativesDAO.queryOne({ _id: order.relative });
      let company = await CompaniesDAO.queryOne({ _id: order.company });
      let user = await UsersDAO.queryOne({ _id: order.user });

      if (order.schedule_information.recurrency !== 0) {
        let eventSeries = {
          user: order.user,
          company: order.company,
          order: order._id,
          caregiver: order.caregiver,

          start_date: order.schedule_information.start_date,

          recurrency_type: order.schedule_information.recurrency,

          schedule: order.schedule_information.schedule,

          title: relative.name,
        };

        let eventSeriesAdded = await EventsSeriesDAO.create(eventSeries);
      }

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

      const crmUsers = (
        await CRMUsersDAO.queryList({
          company: { $eq: order.company },
        })
      ).data;

      // Only send email to crm users that have the 'orders_emails' permission
      crmUsers = crmUsers.filter((user) => {
        return user?.permissions?.includes('orders_emails');
      });

      const crmEmails = crmUsers.map((user) => {
        if (user?.permissions?.includes('orders_emails')) {
          return user.email;
        }
      });

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

      for (let i = 0; i < crmEmails.length; i++) {
        let companyEmailPayload = {
          name: crmUsers[i].name,
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

          //link: `https://www.business.careplace.pt/app/orders/${order._id}`,
          link: `http://localhost:4000/app/orders/${order._id}/view`,
        };

        let crmNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
          'crm_order_accepted',
          companyEmailPayload
        );

        await SES.sendEmail([crmEmails[i]], crmNewOrderEmail.subject, crmNewOrderEmail.htmlBody);
      }
    } catch (error) {
      logger.error(error.stack);
      next(error);
    }
  }

  static async declineOrder(req, res, next) {}

  static async sendQuote(req, res, next) {
    try {
      let response = {};

      let AuthHelper = new authHelper();
      let OrdersDAO = new ordersDAO();
      let CompaniesDAO = new companiesDAO();
      let UsersDAO = new usersDAO();
      let DateUtils = new dateUtils();

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._401('Missing required access token.');
      }

      const { order_total } = req.body;

      if (!order_total) {
        throw new HTTPError._400('Missing required fields.');
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      let companyId = user.company._id;

      let order;

      try {
        order = await OrdersDAO.queryOne({ _id: req.params.id }, [
          {
            path: 'relative',
            model: 'Relative',
          },
          {
            path: 'company',
            model: 'Company',
          },
          {
            path: 'services',
            model: 'Service',
          },
          {
            path: 'user',
            model: 'marketplace_user',
          },
        ]);
      } catch (error) {
        switch (error.type) {
          case 'NOT_FOUND': {
            response.statusCode = 404;
            response.data = {
              error: error.message,
              type: 'NOT_FOUND',
            };

            return next(response);
          }

          default: {
            response.statusCode = 500;
            response.data = {
              error: error.message,
            };

            return next(response);
          }
        }
      }

      logger.info("USER'S COMPANY ID: " + companyId);

      logger.info('ORDER COMPANY ID: ' + order.company._id);

      logger.info('EQUALS ? ' + (companyId.toString() === order.company._id.toString()));

      logger.info('USER PERMISSIONS: ' + user.permissions);

      if (
        companyId.toString() !== order.company._id.toString() ||
        !user?.permissions?.includes('orders_edit')
      ) {
        throw new HTTPError._403('You are not authorized to send a quote for this order.');
      }

      order.order_total = order_total;

      await OrdersDAO.update(order);

      /**
       *  if(order.status != "pending"){
        throw new HTTPError._400("You cannot send a quote for this order.");
      }
       */

      response = {
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

        subTotal: (order.order_total / 1.23 / 100).toFixed(2),
        taxAmount: ((order.order_total - order.order_total / 1.23) / 100).toFixed(2),
        total: (order.order_total / 100).toFixed(2),

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

      logger.info('EMAIL ' + order.user.email);

      await SES.sendEmail(
        [order.user.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );

      return;

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
