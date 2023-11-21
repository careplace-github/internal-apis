// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, {
  FilterQuery,
  ObjectId,
  QueryOptions,
  Types,
  model,
  startSession,
} from 'mongoose';
// lodash
import { omit } from 'lodash';

// @api
import {
  CaregiversDAO,
  CustomersDAO,
  HealthUnitsDAO,
  HealthUnitReviewsDAO,
  HomeCareOrdersDAO,
  PatientsDAO,
  EventsDAO,
  CollaboratorsDAO,
  EventSeriesDAO,
} from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICaregiver,
  ICaregiverDocument,
  IHealthUnit,
  IHealthUnitDocument,
  ICustomer,
  IEventSeries,
  IOrder,
  IOrderDocument,
  IPatient,
  IService,
  IServiceDocument,
  ICollaboratorDocument,
  ICustomerDocument,
  IQueryListResponse,
  IPatientDocument,
  IEventDocument,
  IEvent,
  IEventSeriesDocument,
} from 'src/packages/interfaces';

import {
  CaregiverModel,
  CollaboratorModel,
  CustomerModel,
  EventModel,
  EventSeriesModel,
  OrderModel,
  PatientModel,
  ServiceModel,
} from 'src/packages/models';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { AuthUtils, HTTPError, DateUtils } from 'src/packages/utils';

// @constants
import {
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_SES_ORDERS_BCC_EMAIL,
} from '@constants';
// @logger
import logger from '@logger';
// @data
import { services } from '@assets';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { access } from 'fs';
import { PATHS } from 'src/packages/routes';

export default class OrdersController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();

  static CustomersDAO = new CustomersDAO();

  static CaregiversDAO = new CaregiversDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static CollaboratorsDAO = new CollaboratorsDAO();

  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  static EventSeriesDAO = new EventSeriesDAO();

  static PatientsDAO = new PatientsDAO();

  static EventsDAO = new EventsDAO();

  // helpers
  static AuthHelper = AuthHelper;

  static EmailHelper = EmailHelper;

  // services
  static SES = SESService;

  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);

  static StripeService = StripeService;

  // utils
  static AuthUtils = AuthUtils;

  static DateUtils = DateUtils;

  // -------------------------------------------------- //
  //                     CUSTOMERS                      //
  // -------------------------------------------------- //

  static async customerCreateHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const order = req.body as IOrder;
      let patient: IPatient;

      const healthUnitId = req.body.health_unit;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user: ICollaboratorDocument | ICustomerDocument | ICaregiverDocument;

      try {
        user = await AuthHelper.getUserFromDB(accessToken);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      const patientId = (order.patient as mongoose.Types.ObjectId).toString();
      try {
        patient = await OrdersController.PatientsDAO.retrieve(patientId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._400('Patient not found'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      // Check if the patient belongs to the customer
      if (patient?.customer?.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You are not authorized to create this order.'));
      }

      let healthUnit: IHealthUnitDocument;
      logger.info(`Health Unit ID: ${healthUnitId}`);
      try {
        healthUnit = await OrdersController.HealthUnitsDAO.queryOne({ _id: healthUnitId });
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._400('Health Unit not found'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      order.customer = user._id;
      order.status = 'new';
      order.source = 'marketplace';

      order._id = new mongoose.Types.ObjectId();

      // Use the first 8 characters of the order id as the order number
      // HC-XXXXXXXX -> Home Care Order
      order.order_number = `HC-${order._id.toString().slice(-6).toUpperCase()}`;

      const newOrder = new OrderModel(order);

      // validate the order
      const validationError = newOrder.validateSync({
        pathsToSkip: ['billing_details'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }
      let orderCreated: IOrderDocument;
      try {
        orderCreated = await OrdersController.HomeCareOrdersDAO.create(newOrder);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = orderCreated;

      // Pass to the next middleware to handle the response
      next(response);

      /**
       * From 'services' array, get the services that are in the order
       */
      const orderServices: IServiceDocument[] = [];

      for (let i = 0; i < order!.services!.length; i++) {
        const service = services.find((service) => {
          if (order?.services && service?._id == order.services[i]?.toString()) {
            return service;
          }
        });

        if (service) {
          const auxService = new ServiceModel(service);

          orderServices.push(auxService);
        }
      }

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      const servicesNames = orderServices
        .map((service) => {
          if (service) {
            return service.name;
          }
        })
        .join(', ');

      const schedule = await OrdersController.DateUtils.getScheduleRecurrencyText(
        order?.schedule_information?.schedule
      );

      const birthdate = await OrdersController.DateUtils.convertDateToReadableString(
        patient.birthdate
      );

      const orderStart = await OrdersController.DateUtils.convertDateToReadableString2(
        order?.schedule_information?.start_date
      );

      const userEmailPayload = {
        customerName: user.name,
        healthUnitName: healthUnit?.business_profile?.name,
        orderStart,
        orderSchedule: schedule,
        orderServices: servicesNames,
        orderRecurrency:
          order?.schedule_information?.recurrency === 1
            ? 'Semanal'
            : order?.schedule_information?.recurrency === 2
            ? 'Quinzenal'
            : order?.schedule_information?.recurrency === 4
            ? 'Mensal'
            : 'N/A',

        patientName: patient.name,
        patientBirthdate: birthdate,
        patientMedicalInformation: patient?.medical_conditions || 'N/A',

        patientStreet: patient.address.street,
        patientCity: patient.address.city,
        patientPostalCode: patient.address.postal_code,
        patientCountry: patient.address.country,

        website: PATHS.marketplace.home,
        privacyPolicy: PATHS.marketplace.privacyPolicy,
        termsAndConditions: PATHS.marketplace.termsAndConditions,
      };

      const marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_home_care_order_received',
        userEmailPayload
      );

      if (
        !marketplaceNewOrderEmail ||
        !marketplaceNewOrderEmail.htmlBody ||
        !marketplaceNewOrderEmail.subject
      ) {
        return next(new HTTPError._500('Error getting email template'));
      }

      await OrdersController.SES.sendEmail(
        [user.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody,
        undefined,
        undefined,
        [AWS_SES_ORDERS_BCC_EMAIL]
      );

      let collaborators = (
        await OrdersController.CollaboratorsDAO.queryList({
          health_unit: { $eq: orderCreated.health_unit },
        })
      ).data;

      // Only send email to business users that have the 'orders_emails' permission
      collaborators = collaborators.filter((user) => user?.permissions?.includes('orders_emails'));

      let collaboratorsEmails = collaborators.map((user) => user.email);

      // Check if there are repeated emails
      const collaboratorsEmailsSet = new Set(collaboratorsEmails);

      // Convert the set to an array
      const collaboratorsEmailsArray = Array.from(collaboratorsEmailsSet);

      // Update the collaboratorsEmails array without repeated emails
      collaboratorsEmails = collaboratorsEmailsArray;

      for (let i = 0; i < collaboratorsEmails.length; i++) {
        const healthUnitEmailPayload = {
          collaboratorName: collaborators[i].name,
          healthUnitName: healthUnit!.business_profile!.name,

          link: `${PATHS.business.orders.edit(orderCreated._id)}`,
          website: PATHS.business.home,
          privacyPolicy: PATHS.business.privacyPolicy,
          termsAndConditions: PATHS.business.termsAndConditions,
        };

        const businessNewOrderEmail = await OrdersController.EmailHelper.getEmailTemplateWithData(
          'business_new_home_care_order',
          healthUnitEmailPayload
        );

        if (
          !businessNewOrderEmail ||
          !businessNewOrderEmail.htmlBody ||
          !businessNewOrderEmail.subject
        ) {
          return next(new HTTPError._500('Error getting email template'));
        }

        if (order.source === 'marketplace') {
          await OrdersController.SES.sendEmail(
            [collaboratorsEmails[i]],
            businessNewOrderEmail.subject,
            businessNewOrderEmail.htmlBody
          );
        }
      }
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async customerOrderHelp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const order = req.body as IOrder;

      // create customer model
      const customer = new CustomerModel(order.customer);

      // validate the customer
      const customerValidationError = customer.validateSync();

      if (customerValidationError) {
        return next(new HTTPError._400(customerValidationError.message));
      }

      // create customer in database
      let customerCreated: ICustomerDocument;

      try {
        customerCreated = await OrdersController.CustomersDAO.create(customer);
      } catch (error: any) {
        switch (error.type) {
          case 'ALREADY_EXISTS':
            return next(new HTTPError._409('Customer already exists.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // add the customer id to the order
      order.customer = customerCreated._id;

      (order.patient as IPatient).birthdate = new Date();

      (order.patient as IPatient).address = {
        street: 'N/A',
        postal_code: 'N/A',
        city: 'N/A',
        country: 'PT',
      };

      // create patient model
      const patient = new PatientModel(order.patient);

      // validate the patient
      const patientValidationError = patient.validateSync();

      if (patientValidationError) {
        return next(new HTTPError._400(patientValidationError.message));
      }

      // create patient in database
      let patientCreated: IPatientDocument;

      try {
        patientCreated = await OrdersController.PatientsDAO.create(patient);
      } catch (error: any) {
        switch (error.type) {
          case 'ALREADY_EXISTS':
            return next(new HTTPError._409('Patient already exists.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // add the patient id to the order
      order.patient = patientCreated._id;

      order.status = 'new';
      order.source = 'lead';

      order._id = new mongoose.Types.ObjectId();

      // Use the first 8 characters of the order id as the order number
      // HC-XXXXXXXX -> Home Care Order
      order.order_number = `HC-${order._id.toString().slice(-6).toUpperCase()}`;

      const newOrder = new OrderModel(order);

      // validate the order
      const validationError = newOrder.validateSync({
        pathsToSkip: ['billing_details'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }
      let orderCreated: IOrderDocument;
      try {
        orderCreated = await OrdersController.HomeCareOrdersDAO.create(newOrder);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = orderCreated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async customerCancelHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const orderId = req.params.id;

      let accessToken: string;

      if (!req.body.cancellation_reason) {
        return next(new HTTPError._400('`cancellation_reason` is required.'));
      }

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user: ICollaboratorDocument | ICustomerDocument | ICaregiverDocument;

      try {
        user = await AuthHelper.getUserFromDB(accessToken);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      let order: IOrderDocument;

      try {
        order = await OrdersController.HomeCareOrdersDAO.retrieve(
          orderId,

          // Populate the fields patient and caregiver
          [
            {
              path: 'patient',
              model: 'Patient',
            },
            {
              path: 'caregiver',
              model: 'Caregiver',
            },
            {
              path: 'services',
              model: 'Service',
            },
            {
              path: 'health_unit',
              model: 'HealthUnit',
            },
            {
              path: 'customer',
              model: 'Customer',
              select: 'name email phone address _id',
            },
          ]
        );
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (order!.customer!._id.toString() !== user._id.toString() || order.status === 'new') {
        return next(new HTTPError._403('You are not authorized to cancel this order.'));
      }

      order.status = 'cancelled';
      order.cancellation_reason = req.body.cancellation_reason;
      order.cancelledAt = new Date();

      // validate the order
      const validationError = order.validateSync({});

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let orderUpdated: IOrderDocument;
      try {
        orderUpdated = await OrdersController.HomeCareOrdersDAO.update(order);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = orderUpdated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async retrieveCustomerHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };
      let order: IOrderDocument;

      const orderId = req.params.id;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user: ICollaboratorDocument | ICustomerDocument | ICaregiverDocument;

      try {
        user = await AuthHelper.getUserFromDB(accessToken);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      try {
        order = await OrdersController.HomeCareOrdersDAO.retrieve(
          orderId,

          // Populate the fields patient and caregiver
          [
            {
              path: 'patient',
              model: 'Patient',
            },
            {
              path: 'caregiver',
              model: 'Caregiver',
            },
            {
              path: 'services',
              model: 'Service',
            },
            {
              path: 'health_unit',
              model: 'HealthUnit',
            },
            {
              path: 'customer',
              model: 'Customer',
              select: 'name email phone address _id',
            },
          ]
        );
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (order!.customer!._id.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You are not authorized to retrieve this order.'));
      }

      let orderPaymentMethod: Stripe.PaymentMethod | string | null = null;

      const subscriptionId = order.stripe_information.subscription_id;

      if (subscriptionId) {
        try {
          const subscription = await OrdersController.StripeService.getSubscription(subscriptionId);

          orderPaymentMethod = subscription.default_payment_method;
        } catch (error: any) {
          switch (error.type) {
            case 'NOT_FOUND':
              break;
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      const orderObj = order.toObject();

      orderObj.stripe_information.payment_method = orderPaymentMethod || null;

      response.statusCode = 200;
      response.data = orderObj;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listCustomerHomeCareOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let homeCareOrders: IQueryListResponse<IOrderDocument> | undefined;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user: ICollaboratorDocument | ICustomerDocument | ICaregiverDocument;

      try {
        user = await AuthHelper.getUserFromDB(accessToken);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      try {
        homeCareOrders = await OrdersController.HomeCareOrdersDAO.queryList(
          {
            customer: user._id,
            status: {
              $nin: ['declined'],
            },
          },
          undefined,
          undefined,
          undefined,
          // Populate the fields patient and caregiver
          [
            {
              path: 'patient',
              model: 'Patient',
            },
            {
              path: 'caregiver',
              model: 'Caregiver',
            },
            {
              path: 'services',
              model: 'Service',
            },
            {
              path: 'health_unit',
              model: 'HealthUnit',
            },
          ]
        );
      } catch (error: any) {
        switch (error.type) {
          default:
            next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = homeCareOrders?.data ? 200 : 204;
      response.data = homeCareOrders || {};

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async customerUpdateHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const orderId = req.params.id;

      const order = req.body as IOrder;

      // remove the fields that should not be updated
      const reqOrder = omit(order, [
        '_id',
        'health_unit',
        'customer',
        // 'patient',
        'status',
        'decline_reason',
        'screening_visit',
        'stripe_information',
      ]);

      // retrieve the order from the database
      let orderExists: IOrderDocument;

      try {
        orderExists = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);
        logger.info(`ORDER EXISTS: ${orderExists}`);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Home care order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      const user = await OrdersController.AuthHelper.getUserFromDB(accessToken);

      // check if the user is authorized to update the order
      if (orderExists.customer.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You are not authorized to update this order.'));
      }

      // create a new order object with the updated fields
      const updatedOrder = new OrderModel({
        ...orderExists.toJSON(),
        ...reqOrder,
      });

      logger.info(`ORDER TO UPDATE: ${updatedOrder}`);

      // validate the order
      const validationError = updatedOrder.validateSync({});

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let orderUpdated: IOrderDocument;
      try {
        orderUpdated = await OrdersController.HomeCareOrdersDAO.update(updatedOrder);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = orderUpdated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  // -------------------------------------------------- //
  //                     HEALTH UNITS                   //
  // -------------------------------------------------- //

  // TODO healthUnitCreateHomeCareOrder
  static async healthUnitCreateHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const order = req.body as IOrder;

      if (!order.patient) {
        return next(new HTTPError._400('Missing required field: `patient`.'));
      }

      if (!order.customer) {
        return next(new HTTPError._400('Missing required field: `customer`.'));
      }

      if (!order.caregiver) {
        return next(new HTTPError._400('Missing required field: `caregiver`.'));
      }

      const user = await OrdersController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      if (!user?.permissions?.includes('orders_edit')) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      order.health_unit = user.health_unit._id as Types.ObjectId;

      order.status = 'accepted';
      order.source = 'external';

      order._id = new mongoose.Types.ObjectId();

      // Use the first 8 characters of the order id as the order number
      // HC-XXXXXXXX -> Home Care Order
      order.order_number = `HC-${order._id.toString().slice(-6).toUpperCase()}`;

      const newOrder = new OrderModel(order);

      // validate the order
      const validationError = newOrder.validateSync({
        pathsToSkip: ['billing_details'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }
      let orderCreated: IOrderDocument;
      try {
        orderCreated = await OrdersController.HomeCareOrdersDAO.create(newOrder);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      let patient: IPatientDocument;

      const patientId = (order.patient as mongoose.Types.ObjectId).toString();

      try {
        patient = await OrdersController.PatientsDAO.retrieve(patientId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Patient not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // Create a new event series for the order
      if (order?.schedule_information?.recurrency !== 0) {
        // TODO: get the correct schedule for the event series based on the order schedule_information.schedule and schedule_information.start_date (user may want mondays and wednesdays, and the start date may be a tuesday)
        const eventSeriesSchedule = order.schedule_information.schedule;

        // for each
        for (let i = 0; i < eventSeriesSchedule.length; i++) {
          eventSeriesSchedule[i].start =
            await OrdersController.DateUtils.getNextWeekdayWithTimeFromDate(
              eventSeriesSchedule[i].start,
              eventSeriesSchedule[i].week_day
            );
          eventSeriesSchedule[i].end =
            await OrdersController.DateUtils.getNextWeekdayWithTimeFromDate(
              eventSeriesSchedule[i].end,
              eventSeriesSchedule[i].week_day
            );
        }

        const eventSeries: IEventSeries = {
          _id: new Types.ObjectId(),

          owner_type: 'health_unit',
          owner: order.health_unit,

          order: orderCreated._id,

          start_date: order.schedule_information.start_date,

          recurrency: order.schedule_information.recurrency,

          schedule: eventSeriesSchedule,

          title: patient.name,

          end_series: {
            ending_type: 0,
          },

          textColor: '#54D62C',
        };

        const newEventSeries = new EventSeriesModel(eventSeries);

        const eventSeriesAdded = await OrdersController.EventSeriesDAO.create(newEventSeries);
      }

      response.statusCode = 200;
      response.data = orderCreated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async customerUpdateHomeCareOrderBillingDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await OrdersController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      const orderId = req.params.order;

      const billingDetails = req.body.billing_details;

      const order = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);

      if (order.customer.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You do not have access to retrieve this home care order.'));
      }

      const orderObj = order.toObject();

      orderObj.billing_details = billingDetails;

      const updatedOrder = new OrderModel(orderObj);

      let orderUpdated: IOrderDocument;
      try {
        orderUpdated = await OrdersController.HomeCareOrdersDAO.update(updatedOrder);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = orderUpdated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      return next(new HTTPError._500(error.message));
    }
  }

  static async healthUnitRetrieveHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await OrdersController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      if (!user?.permissions?.includes('orders_view')) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      // Retrieve the home care order based on the provided request parameters
      const orderId = req.params.id;

      let homeCareOrder: IOrderDocument;

      try {
        homeCareOrder = await OrdersController.HomeCareOrdersDAO.retrieve(orderId, [
          {
            path: 'patient',
            model: 'Patient',
            select: 'name phone birthdate address gender medical_conditions',
          },
          {
            path: 'caregiver',
            model: 'Caregiver',
          },
          {
            path: 'services',
            model: 'Service',
          },
          {
            path: 'customer',
            model: 'Customer',
          },
          {
            path: 'visits',
            model: 'Event',
          },
        ]);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Home care order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      const healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You are not authorized to decline this order.'));
        }
        return user?.health_unit?._id.toString();
      });

      // Check if the home care order belongs to the user's health unit
      if (homeCareOrder.health_unit.toString() !== healthUnitId) {
        return next(new HTTPError._403('You do not have access to retrieve this home care order.'));
      }

      response.statusCode = 200;
      response.data = homeCareOrder;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  // TODO send email to customer when the order is updated
  static async healthUnitUpdateHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }
      const [app, user] = await Promise.all([
        OrdersController.AuthHelper.getAppId(accessToken),
        OrdersController.AuthHelper.getUserFromDB(accessToken),
      ]);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      if (!user.permissions.includes('orders_edit')) {
        return next(new HTTPError._403('You do not have access to update home care orders.'));
      }

      const orderId = req.params.id;
      let orderExists: IOrderDocument;

      try {
        orderExists = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);
        const test = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Home care order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (
        ('health_unit' in user &&
          orderExists.health_unit.toString() !== user.health_unit._id.toString()) ||
        !user.permissions.includes('orders_edit')
      ) {
        return next(new HTTPError._403('You do not have access to update this home care order.'));
      }

      // Get the fields to update from the request body
      const reqOrder = req.body as IOrder;

      // Thos endpoint allows health units to update their offline orders, so it is allowed to update fields like the status
      const sanitizedReqOrder = omit(reqOrder, [
        '_id',
        'health_unit',
        'patient',
        'decline_reason',
        'stripe_information',
      ]);

      const newOrder = {
        ...orderExists.toObject(),
        ...sanitizedReqOrder,
      };

      const updateOrder = new OrderModel(newOrder);

      let updatedOrder: IOrderDocument;

      try {
        updatedOrder = await OrdersController.HomeCareOrdersDAO.update(updateOrder);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      const eventSeries = await OrdersController.EventSeriesDAO.queryOne({
        order: orderId,
      });

      // Update the event series schedule
      if (eventSeries) {
        let eventSeriesSchedule;
        // Create a new event series for the order
        if (updatedOrder?.schedule_information?.recurrency !== 0) {
          // TODO: get the correct schedule for the event series based on the order schedule_information.schedule and schedule_information.start_date (user may want mondays and wednesdays, and the start date may be a tuesday)
          eventSeriesSchedule = updatedOrder.schedule_information.schedule;

          // for each
          for (let i = 0; i < eventSeriesSchedule.length; i++) {
            eventSeriesSchedule[i].start =
              await OrdersController.DateUtils.getNextWeekdayWithTimeFromDate(
                eventSeriesSchedule[i].start,
                eventSeriesSchedule[i].week_day
              );
            eventSeriesSchedule[i].end =
              await OrdersController.DateUtils.getNextWeekdayWithTimeFromDate(
                eventSeriesSchedule[i].end,
                eventSeriesSchedule[i].week_day
              );
          }
        }
        eventSeries.schedule = eventSeriesSchedule;

        try {
          await OrdersController.EventSeriesDAO.update(eventSeries);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = updatedOrder;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async healthUnitDeleteHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await OrdersController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You do not have access to delete home care orders.'));
      }

      if (!user?.permissions?.includes('orders_edit')) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      // Retrieve the home care order based on the provided request parameters
      const orderId = req.params.id;

      if (!orderId) {
        return next(new HTTPError._400('Missing required field: `id`.'));
      }

      let homeCareOrder: IOrderDocument;

      try {
        homeCareOrder = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (error: any) {
        // If the home care order is not found, return an error
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Home care order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // Check if the order is of type external
      if (homeCareOrder.source !== 'external') {
        return next(new HTTPError._403('You cannot delete this order.'));
      }

      // Check if the home care order belongs to the user's health unit
      if (homeCareOrder.health_unit.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('You do not have access to delete this home care order.'));
      }

      // Delete the home care order
      try {
        await OrdersController.HomeCareOrdersDAO.delete(orderId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      let eventSeries: IEventSeriesDocument | undefined;

      // Check if the home care order has an event series
      try {
        eventSeries = await OrdersController.EventSeriesDAO.queryOne({
          order: orderId,
        });
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            break;
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // Delete the event series
      if (eventSeries) {
        try {
          await OrdersController.EventSeriesDAO.delete(eventSeries._id);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = homeCareOrder;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listHealthUnitHomeCareOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };
      let homeCareOrders: IOrderDocument[] = [];

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user: ICollaboratorDocument | ICaregiverDocument | ICustomerDocument;
      try {
        user = await AuthHelper.getUserFromDB(accessToken);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      const healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
        }
        return user?.health_unit?._id.toString();
      });

      try {
        homeCareOrders = (
          await OrdersController.HomeCareOrdersDAO.queryList(
            {
              health_unit: { $eq: healthUnitId },
            },

            undefined,
            undefined,
            undefined,

            [
              {
                path: 'customer',
                model: 'Customer',
                select: '-_id -stripe_information -settings -cognito_id -createdAt -updatedAt -__v',
              },
              {
                path: 'patient',
                model: 'Patient',
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
          )
        ).data;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = homeCareOrders;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async acceptHomeCareOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to accept this order.'));
      }

      const healthUnitId = user.health_unit._id.toString();

      let order: IOrderDocument;
      try {
        order = await OrdersController.HomeCareOrdersDAO.retrieve(req.params.id);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (healthUnitId !== order?.health_unit?.toString()) {
        return next(new HTTPError._403('You are not authorized to accept this order.'));
      }

      if (order.status !== 'new') {
        return next(
          new HTTPError._409(`Order status is ${order.status}. You cannot accept this order.`)
        );
      }

      order.status = 'accepted';

      try {
        await OrdersController.HomeCareOrdersDAO.update(order);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = order;

      // Pass to the next middleware to handle the response
      next(response);

      // From the users.patients array, get the patient that matches the patient id in the order
      const patient = await OrdersController.PatientsDAO.queryOne({ _id: order.patient });
      const healthUnit = await OrdersController.HealthUnitsDAO.queryOne({ _id: order.health_unit });
      const customer = await OrdersController.CustomersDAO.queryOne({ _id: order.customer });

      if (order?.schedule_information?.recurrency !== 0) {
        const eventSeries: IEventSeries = {
          _id: new Types.ObjectId(),

          owner_type: 'health_unit',
          owner: order.health_unit,

          order: order._id,

          start_date: order.schedule_information.start_date,

          recurrency: order.schedule_information.recurrency,

          schedule: order.schedule_information.schedule,

          title: patient.name,

          end_series: {
            ending_type: 0,
          },

          textColor: '#1890FF',
        };

        const newEventSeries = new EventSeriesModel(eventSeries);

        const eventSeriesAdded = await OrdersController.EventSeriesDAO.create(newEventSeries);
      }

      /**
       * From 'services' array, get the services that are in the order
       */

      const orderServicesAux = order.services.map((serviceId) => {
        const service = services.find((service) => service._id.toString() === serviceId.toString());

        return service;
      });

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      const orderServices = orderServicesAux.map((service) => service?.name).join(', ');

      let collaborators = (
        await OrdersController.CollaboratorsDAO.queryList({
          health_unit: { $eq: order.health_unit },
        })
      ).data;

      // Only send email to business users that have the 'orders_emails' permission
      collaborators = collaborators.filter((user) => user?.permissions?.includes('orders_emails'));

      const collaboratorsEmails = collaborators.map((user) => {
        if (user?.permissions?.includes('orders_emails')) {
          return user.email;
        }
      });

      const schedule = await DateUtils.getScheduleRecurrencyText(
        order.schedule_information.schedule
      );

      const birthdate = await DateUtils.convertDateToReadableString(patient.birthdate);

      const orderStart = await DateUtils.convertDateToReadableString2(
        order.schedule_information.start_date
      );

      const userEmailPayload = {
        customerName: customer.name,
        healthUnitName: healthUnit.business_profile.name,

        orderStart,
        orderSchedule: schedule,
        orderServices,
        orderRecurrency: await DateUtils.getRecurrencyType(order.schedule_information.recurrency),

        patientName: patient.name,
        patientBirthdate: birthdate,
        patientMedicalInformation: patient?.medical_conditions || 'N/A',

        patientStreet: patient.address.street,
        patientCity: patient.address.city,
        patientPostalCode: patient.address.postal_code,
        patientCountry: patient.address.country,

        website: PATHS.marketplace.home,
        privacyPolicy: PATHS.marketplace.privacyPolicy,
        termsAndConditions: PATHS.marketplace.termsAndConditions,
      };

      const marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_home_care_order_accepted',
        userEmailPayload
      );

      if (
        !marketplaceNewOrderEmail ||
        !marketplaceNewOrderEmail.htmlBody ||
        !marketplaceNewOrderEmail.subject
      ) {
        return next(new HTTPError._500('Error while generating email template.'));
      }

      logger.info(`Sending email to customer: ${customer.email}`);

      // Remove if want to send an email confirmation to the user

      // if (order.source === 'marketplace') {
      //   await OrdersController.SES.sendEmail(
      //     [customer.email],
      //     marketplaceNewOrderEmail.subject,
      //     marketplaceNewOrderEmail.htmlBody
      //   );
      // }

      // Send email to all collaborators that have the 'orders_emails' permission
      if (collaboratorsEmails && collaboratorsEmails.length > 0) {
        for (let i = 0; i < collaboratorsEmails.length; i++) {
          const collaboratorEmail = collaboratorsEmails[i];
          if (collaboratorEmail) {
            const healthUnitEmailPayload = {
              collaboratorName: collaborators[i].name,
              healthUnitName: healthUnit.business_profile.name,

              customerName: customer.name,
              customerPhone: customer.phone,

              orderStart,
              orderSchedule: schedule,
              orderRecurrency: await DateUtils.getRecurrencyType(
                order.schedule_information.recurrency
              ),
              orderServices,

              patientName: patient.name,
              patientBirthdate: birthdate,
              patientMedicalInformation: patient?.medical_conditions || 'N/A',

              patientStreet: patient.address.street,
              patientCity: patient.address.city,
              patientPostalCode: patient.address.postal_code,
              patientCountry: patient.address.country,

              link: `${PATHS.business.orders.view(order._id)}`,
              website: PATHS.business.home,
              privacyPolicy: PATHS.business.privacyPolicy,
              termsAndConditions: PATHS.business.termsAndConditions,
            };

            const businessNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
              'business_home_care_order_accepted',
              healthUnitEmailPayload
            );

            if (
              !businessNewOrderEmail ||
              !businessNewOrderEmail.htmlBody ||
              !businessNewOrderEmail.subject
            ) {
              return next(new HTTPError._500('Error while generating email template.'));
            }

            if (order.source === 'marketplace') {
              await OrdersController.SES.sendEmail(
                [collaboratorEmail],
                businessNewOrderEmail.subject,
                businessNewOrderEmail.htmlBody
              );
            }
          }
        }
      }
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  // TODO send email to Careplace Backoffice when an order is declined
  static async declineHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const { decline_reason } = req.body as {
        decline_reason: string;
      };

      if (!decline_reason) {
        return next(new HTTPError._400('Missing decline reason.'));
      }

      const healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You are not authorized to decline this order.'));
        }
        return user?.health_unit?._id.toString();
      });

      let order: IOrderDocument;
      try {
        order = await OrdersController.HomeCareOrdersDAO.retrieve(req.params.id);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (healthUnitId !== order?.health_unit?.toString()) {
        return next(new HTTPError._403('You are not authorized to decline this order.'));
      }

      if (order.status !== 'new') {
        return next(new HTTPError._400('You cannot decline this order.'));
      }

      order.status = 'declined';
      order.decline_reason = decline_reason;

      try {
        await OrdersController.HomeCareOrdersDAO.update(order);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = order;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async sendHomeCareOrderQuote(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const { order_total } = req.body;

      if (!order_total) {
        next(new HTTPError._400('Missing required `order_total`.'));
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      const healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You are not authorized to decline this order.'));
        }
        return user?.health_unit?._id.toString();
      });

      let order: IOrderDocument;

      const orderId = req.params.id;

      try {
        order = await OrdersController.HomeCareOrdersDAO.queryOne({ _id: orderId }, [
          {
            path: 'patient',
            model: 'Patient',
          },
          {
            path: 'health_unit',
            model: 'HealthUnit',
          },

          {
            path: 'customer',
            model: 'Customer',
          },
        ]);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Order not found.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      if (
        healthUnitId !== order.health_unit._id.toString() ||
        !user?.permissions?.includes('orders_edit')
      ) {
        return next(new HTTPError._403('You are not authorized to send a quote for this order.'));
      }

      if (
        order.status === 'declined' ||
        order.status === 'cancelled' ||
        order.status === 'completed'
      ) {
        return next(new HTTPError._403('You are not authorized to send a quote for this order.'));
      }

      order.order_total = order_total;

      // update the order status to 'pending_payment'
      order.status = 'pending_payment';

      await OrdersController.HomeCareOrdersDAO.update(order);

      response.statusCode = 200;
      response.data = order;

      // Pass to the next middleware to handle the response
      next(response);

      // Only send emails to the orders originated from our marketplace
      if (order.source === 'marketplace') {
        /**
         * From 'services' array, get the services that are in the order
         */

        const orderServicesAux = order.services.map((serviceId) => {
          const service = services.find(
            (service) => service._id.toString() === serviceId.toString()
          );

          return service;
        });

        // Create a string with the services names
        // Example: "Cleaning, Laundry, Shopping"
        const orderServices = orderServicesAux.map((service) => service?.name).join(', ');

        const schedule = await DateUtils.getScheduleRecurrencyText(
          order.schedule_information.schedule
        );

        const birthdate = await DateUtils.convertDateToReadableString(
          (order.patient as IPatient).birthdate
        );

        const orderStart = await DateUtils.convertDateToReadableString2(
          order.schedule_information.start_date
        );
        let collaborators = (
          await OrdersController.CollaboratorsDAO.queryList({
            health_unit: { $eq: order.health_unit },
          })
        ).data;

        // Only send email to business users that have the 'orders_emails' permission
        collaborators = collaborators.filter((user) =>
          user?.permissions?.includes('orders_emails')
        );

        const collaboratorsEmails = collaborators.map((user) => {
          if (user?.permissions?.includes('orders_emails')) {
            return user.email;
          }
        });

        const userEmailPayload = {
          customerName: (order.customer as ICustomer).name,
          healthUnitName: (order.health_unit as IHealthUnit).business_profile.name,

          link: `${PATHS.marketplace.orders.checkout(order._id)}`,

          subTotal: (order.order_total / 1.23).toFixed(2),
          taxAmount: (order.order_total - order.order_total / 1.23).toFixed(2) || '0.00',
          total: order.order_total.toFixed(2),

          orderStart,
          orderSchedule: schedule,
          orderServices,
          orderRecurrency: await DateUtils.getRecurrencyType(order.schedule_information.recurrency),

          patientName: (order.patient as IPatient).name,
          patientBirthdate: birthdate,
          patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'n/a',

          patientStreet: (order.patient as IPatient).address.street,
          patientCity: (order.patient as IPatient).address.city,
          patientPostalCode: (order.patient as IPatient).address.postal_code,
          patientCountry: (order.patient as IPatient).address.country,

          website: PATHS.marketplace.home,
          privacyPolicy: PATHS.marketplace.privacyPolicy,
          termsAndConditions: PATHS.marketplace.termsAndConditions,
        };

        const marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
          'marketplace_home_care_order_quote',
          userEmailPayload
        );

        if (
          !marketplaceNewOrderEmail ||
          !marketplaceNewOrderEmail.htmlBody ||
          !marketplaceNewOrderEmail.subject
        ) {
          return next(new HTTPError._500('Error while getting the email template.'));
        }

        logger.info('Sending email to customer: ', (order.customer as ICustomer).email);

        if (order.source === 'marketplace') {
          await OrdersController.SES.sendEmail(
            [(order.customer as ICustomer).email],
            marketplaceNewOrderEmail.subject,
            marketplaceNewOrderEmail.htmlBody
          );
        }

        // Send email to all collaborators that have the 'orders_emails' permission
        if (collaboratorsEmails && collaboratorsEmails.length > 0) {
          for (let i = 0; i < collaboratorsEmails.length; i++) {
            const collaboratorEmail = collaboratorsEmails[i];
            if (collaboratorEmail) {
              const healthUnitEmailPayload = {
                collaboratorName: collaborators[i].name,
                healthUnitName: (order.health_unit as IHealthUnit).business_profile.name,

                link: `${PATHS.business.orders.view(order._id)}`,

                subTotal: (order.order_total / 1.23).toFixed(2),
                taxAmount: (order.order_total - order.order_total / 1.23).toFixed(2),
                total: order.order_total.toFixed(2),

                orderStart,
                orderSchedule: schedule,
                orderServices,
                orderRecurrency: await DateUtils.getRecurrencyType(
                  order.schedule_information.recurrency
                ),

                patientName: (order.patient as IPatient).name,
                patientBirthdate: birthdate,
                patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'n/a',

                patientStreet: (order.patient as IPatient).address.street,
                patientCity: (order.patient as IPatient).address.city,
                patientPostalCode: (order.patient as IPatient).address.postal_code,
                patientCountry: (order.patient as IPatient).address.country,

                customerName: (order.customer as ICustomer).name,
                customerPhone: (order.customer as ICustomer).phone,

                website: PATHS.business.home,
                privacyPolicy: PATHS.business.privacyPolicy,
                termsAndConditions: PATHS.business.termsAndConditions,
              };

              const businessNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
                'business_home_care_order_quote_sent',
                healthUnitEmailPayload
              );

              if (
                !businessNewOrderEmail ||
                !businessNewOrderEmail.htmlBody ||
                !businessNewOrderEmail.subject
              ) {
                return next(new HTTPError._500('Error while generating email template.'));
              }

              if (order.source === 'marketplace') {
                await OrdersController.SES.sendEmail(
                  [collaboratorEmail],
                  businessNewOrderEmail.subject,
                  businessNewOrderEmail.htmlBody
                );
              }
            }
          }
        }
      }
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async scheduleHomeCareOrderVisit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };
      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const { visit_start, visit_end } = req.body;

      if (!visit_start) {
        return next(new HTTPError._400('Missing required `visit_start`.'));
      }

      if (!visit_end) {
        return next(new HTTPError._400('Missing required `visit_end`.'));
      }

      let order: IOrderDocument;
      try {
        order = await OrdersController.HomeCareOrdersDAO.queryOne({ _id: req.params.id }, [
          {
            path: 'patient',
            model: 'Patient',
          },
          {
            path: 'health_unit',
            model: 'HealthUnit',
          },

          {
            path: 'customer',
            model: 'Customer',
          },
        ]);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // Create an event
      const event: IEvent = {
        _id: new Types.ObjectId(),

        owner_type: 'health_unit',
        owner: order.health_unit,

        order: order._id,

        start: visit_start,

        title:
          order?.visits?.length > 0
            ? `Visita ao Domicílio: ${(order.patient as IPatient).name}`
            : `Visita de Triagem: ${(order.patient as IPatient).name}`,

        description: ' ',

        textColor: order.source === 'marketplace' ? '#04297A' : '#054f02',

        end: visit_end,
      };

      const newEvent = new EventModel(event);

      // validate event
      const validationErrors = await newEvent.validateSync();

      if (validationErrors) {
        return next(new HTTPError._400(`Invalid event: ${validationErrors.message}`));
      }

      let eventAdded: IEventDocument;

      try {
        eventAdded = await OrdersController.EventsDAO.create(newEvent);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      order.visits.push(eventAdded._id);

      try {
        await OrdersController.HomeCareOrdersDAO.update(order);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = order;

      // Pass to the next middleware to handle the response
      next(response);

      // Only send emails to the orders originated from our marketplace
      if (order.source === 'marketplace') {
        /**
         * From 'services' array, get the services that are in the order
         */

        const orderServicesAux = order.services.map((serviceId) => {
          const service = services.find(
            (service) => service._id.toString() === serviceId.toString()
          );

          return service;
        });

        // Create a string with the services names
        // Example: "Cleaning, Laundry, Shopping"
        const orderServices = orderServicesAux.map((service) => service?.name).join(', ');

        let collaborators = (
          await OrdersController.CollaboratorsDAO.queryList({
            health_unit: { $eq: order.health_unit },
          })
        ).data;

        // Only send email to business users that have the 'orders_emails' permission
        collaborators = collaborators.filter((user) =>
          user?.permissions?.includes('orders_emails')
        );

        const collaboratorsEmails = collaborators.map((user) => {
          if (user?.permissions?.includes('orders_emails')) {
            return user.email;
          }
        });

        const schedule = await DateUtils.getScheduleRecurrencyText(
          order.schedule_information.schedule
        );

        const birthdate = await DateUtils.convertDateToReadableString(
          (order.patient as IPatientDocument).birthdate
        );

        const userEmailPayload = {
          customerName: (order.customer as ICustomer).name,
          healthUnitName: (order.health_unit as IHealthUnit).business_profile.name,
          date: await DateUtils.convertDateToReadableString(visit_start),
          time: `${await DateUtils.getTimeFromDate(
            visit_start
          )} - ${await DateUtils.getTimeFromDate(visit_end)}`,

          orderSchedule: schedule,
          orderRecurrency: await DateUtils.getRecurrencyType(order.schedule_information.recurrency),
          orderServices,

          patientName: (order.patient as IPatient).name,
          patientBirthdate: birthdate,
          patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'n/a',
          patientStreet: (order.patient as IPatient).address.street,
          patientCity: (order.patient as IPatient).address.city,
          patientPostalCode: (order.patient as IPatient).address.postal_code,
          patientCountry: (order.patient as IPatient).address.country,

          website: PATHS.marketplace.home,
          privacyPolicy: PATHS.marketplace.privacyPolicy,
          termsAndConditions: PATHS.marketplace.termsAndConditions,
        };

        const marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
          'marketplace_home_care_order_visit_scheduled',
          userEmailPayload
        );

        if (
          !marketplaceNewOrderEmail ||
          !marketplaceNewOrderEmail.htmlBody ||
          !marketplaceNewOrderEmail.subject
        ) {
          return next(new HTTPError._500('Error while getting the email template.'));
        }

        if (order.source === 'marketplace') {
          await OrdersController.SES.sendEmail(
            [(order.customer as ICustomer).email],
            marketplaceNewOrderEmail.subject,
            marketplaceNewOrderEmail.htmlBody
          );
        }

        // Send email to all collaborators that have the 'orders_emails' permission
        if (collaboratorsEmails && collaboratorsEmails.length > 0) {
          for (let i = 0; i < collaboratorsEmails.length; i++) {
            const collaboratorEmail = collaboratorsEmails[i];
            if (collaboratorEmail) {
              const healthUnitEmailPayload = {
                collaboratorName: collaborators[i].name,
                healthUnitName: (order.health_unit as IHealthUnit).business_profile.name,

                date: await DateUtils.convertDateToReadableString(visit_start),

                time: `${await DateUtils.getTimeFromDate(
                  visit_start
                )} - ${await DateUtils.getTimeFromDate(visit_end)}`,

                orderSchedule: schedule,
                orderRecurrency: await DateUtils.getRecurrencyType(
                  order.schedule_information.recurrency
                ),
                orderServices,

                patientName: (order.patient as IPatient).name,
                patientBirthdate: birthdate,
                patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'n/a',
                patientStreet: (order.patient as IPatient).address.street,
                patientCity: (order.patient as IPatient).address.city,
                patientPostalCode: (order.patient as IPatient).address.postal_code,
                patientCountry: (order.patient as IPatient).address.country,

                customerName: (order.customer as ICustomer).name,
                customerPhone: (order.customer as ICustomer).phone,

                website: PATHS.business.home,
                privacyPolicy: PATHS.business.privacyPolicy,
                termsAndConditions: PATHS.business.termsAndConditions,
              };

              const businessNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
                'business_home_care_order_visit_scheduled',
                healthUnitEmailPayload
              );

              if (
                !businessNewOrderEmail ||
                !businessNewOrderEmail.htmlBody ||
                !businessNewOrderEmail.subject
              ) {
                return next(new HTTPError._500('Error while generating email template.'));
              }

              if (order.source === 'marketplace') {
                await OrdersController.SES.sendEmail(
                  [collaboratorEmail],
                  businessNewOrderEmail.subject,
                  businessNewOrderEmail.htmlBody
                );
              }
            }
          }
        }
      }
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
