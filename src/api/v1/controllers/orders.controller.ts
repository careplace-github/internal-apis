// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, Types, startSession } from 'mongoose';
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
  IHomeCareOrder,
  IHomeCareOrderDocument,
  IPatient,
  IService,
  IServiceDocument,
  ICollaboratorDocument,
  ICustomerDocument,
  IQueryListResponse,
} from 'src/packages/interfaces';

import {
  CaregiverModel,
  CollaboratorModel,
  EventSeriesModel,
  HomeCareOrderModel,
  ServiceModel,
} from 'src/packages/models';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { AuthUtils } from 'src/packages/utils';
import { HTTPError, DateUtils } from '@utils';

// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
// @data
import { services } from '@assets';
import Stripe from 'stripe';
import { access } from 'fs';

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

      let order = req.body as IHomeCareOrder;
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

      try {
        patient = await OrdersController.PatientsDAO.queryOne(
          { user: user._id },
          {
            path: 'customer',
            model: 'Customer',
          }
        );
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

      const newOrder = new HomeCareOrderModel(order);

      // validate the order
      const validationError = newOrder.validateSync({
        pathsToSkip: ['billing_details'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }
      let orderCreated: IHomeCareOrderDocument;
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
      let orderServices: IServiceDocument[] = [];

      for (let i = 0; i < order!.services!.length; i++) {
        let service = services.find((service) => {
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

      let schedule = await OrdersController.DateUtils.getScheduleRecurrencyText(
        order?.schedule_information?.schedule
      );

      let birthdate = await OrdersController.DateUtils.convertDateToReadableString(
        patient.birthdate
      );

      let orderStart = await OrdersController.DateUtils.convertDateToReadableString2(
        order?.schedule_information?.start_date
      );

      let userEmailPayload = {
        customerName: user.name,
        healthUnitName: healthUnit?.business_profile?.name,
        orderStart: orderStart,
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
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
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
        marketplaceNewOrderEmail.htmlBody
      );

      let collaborators = (
        await OrdersController.CollaboratorsDAO.queryList({
          health_unit: { $eq: orderCreated.health_unit },
        })
      ).data;

      // Only send email to business users that have the 'orders_emails' permission
      collaborators = collaborators.filter((user) => {
        return user?.permissions?.includes('orders_emails');
      });

      const collaboratorsEmails = collaborators.map((user) => {
        return user.email;
      });

      for (let i = 0; i < collaboratorsEmails.length; i++) {
        let healthUnitEmailPayload = {
          collaboratorName: collaborators[i].name,
          healthUnitName: healthUnit!.business_profile!.name,

          /**
           * @todo Change this link to the correct one
           */
          link: `https://www.sales.careplace.pt/orders/${orderCreated._id}`,
        };

        let businessNewOrderEmail = await OrdersController.EmailHelper.getEmailTemplateWithData(
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

        await OrdersController.SES.sendEmail(
          collaboratorsEmails,
          businessNewOrderEmail.subject,
          businessNewOrderEmail.htmlBody
        );
      }
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
      let order: IHomeCareOrderDocument;

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

      let homeCareOrders: IQueryListResponse<IHomeCareOrderDocument> | undefined;

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
      let response: IAPIResponse = {
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

      const order = req.body as IHomeCareOrder;

      // remove the fields that should not be updated
      const reqOrder = omit(order, [
        '_id',
        'health_unit',
        'customer',
        'patient',
        'status',
        'decline_reason',
        'screening_visit',
        'stripe_information',
      ]);

      // retrieve the order from the database
      let orderExists: IHomeCareOrderDocument;

      try {
        orderExists = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);
        logger.info("ORDER EXISTS: "+ orderExists)
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
      const updatedOrder = new HomeCareOrderModel({
        ...orderExists.toJSON(),
        ...reqOrder,

      });

      logger.info("ORDER TO UPDATE: "+ updatedOrder)

      // validate the order
      const validationError = updatedOrder.validateSync({});

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let orderUpdated: IHomeCareOrderDocument;
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
      let response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

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
      let response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const orderId = req.params.order;

      const billingDetails = req.body.billing_details;

      const order = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);

      const orderObj = order.toObject();

      orderObj.billing_details = billingDetails;

      const updatedOrder = new HomeCareOrderModel(orderObj);

      let orderUpdated: IHomeCareOrderDocument;
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

      let homeCareOrder: IHomeCareOrderDocument;

      try {
        homeCareOrder = await OrdersController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Home care order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      let healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You are not authorized to decline this order.'));
        }
        return user.health_unit._id.toString();
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
      let orderExists: IHomeCareOrderDocument;

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
      const reqOrder = req.body as IHomeCareOrder;

      const sanitizedReqOrder = omit(reqOrder, [
        '_id',
        'health_unit',
        'customer',
        'patient',
        'status',
        'decline_reason',
        'screening_visit',
        'stripe_information',
        'billing_details',
      ]);

      const newOrder = {
        ...orderExists.toObject(),
        ...sanitizedReqOrder,
      };

      const updateOrder = new HomeCareOrderModel(newOrder);

      let updatedOrder: IHomeCareOrderDocument;

      try {
        updatedOrder = await OrdersController.HomeCareOrdersDAO.update(updateOrder);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
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
      let homeCareOrders: IHomeCareOrderDocument[] = [];

      let Cognito = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);

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

      let healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
        }
        return user.health_unit._id.toString();
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

      let caregiver = req.body.caregiver as string;

      if (!caregiver) {
        return next(new HTTPError._400('Missing caregiver.'));
      }

      let caregiverExists: ICaregiverDocument;
      try {
        caregiverExists = await OrdersController.CaregiversDAO.retrieve(caregiver);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Caregiver not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You are not authorized to accept this order.'));
      }

      if (caregiverExists.health_unit.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('Caregiver does not belong to this health unit.'));
      }

      let healthUnitId = user.health_unit._id.toString();

      let order: IHomeCareOrderDocument;
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
      order.caregiver = caregiverExists._id as Types.ObjectId;

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
      let patient = await OrdersController.PatientsDAO.queryOne({ _id: order.patient });
      let healthUnit = await OrdersController.HealthUnitsDAO.queryOne({ _id: order.health_unit });
      let customer = await OrdersController.CustomersDAO.queryOne({ _id: order.customer });

      if (order?.schedule_information?.recurrency !== 0) {
        let eventSeries: IEventSeries = {
          _id: new Types.ObjectId(),

          ownerType: 'health_unit',
          owner: order.health_unit,

          order: order._id,

          start_date: order.schedule_information.start_date,

          recurrency: order.schedule_information.recurrency,

          schedule: order.schedule_information.schedule,

          title: patient.name,

          end_series: {
            ending_type: 0,
          },

          textColor: '1890F',
        };

        const newEventSeries = new EventSeriesModel(eventSeries);

        let eventSeriesAdded = await OrdersController.EventSeriesDAO.create(newEventSeries);
      }

      /**
       * From 'services' array, get the services that are in the order
       */

      let orderServicesAux = order.services.map((serviceId) => {
        const service = services.find((service) => service._id.toString() === serviceId.toString());

        return service;
      });

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      const orderServices = orderServicesAux
        .map((service) => {
          return service?.name;
        })
        .join(', ');

      let collaborators = (
        await OrdersController.CollaboratorsDAO.queryList({
          health_unit: { $eq: order.health_unit },
        })
      ).data;

      // Only send email to business users that have the 'orders_emails' permission
      collaborators = collaborators.filter((user) => {
        return user?.permissions?.includes('orders_emails');
      });

      const collaboratorsEmails = collaborators.map((user) => {
        if (user?.permissions?.includes('orders_emails')) {
          return user.email;
        }
      });

      let schedule = await DateUtils.getScheduleRecurrencyText(order.schedule_information.schedule);

      let birthdate = await DateUtils.convertDateToReadableString(patient.birthdate);

      let orderStart = await DateUtils.convertDateToReadableString2(
        order.schedule_information.start_date
      );

      let userEmailPayload = {
        name: customer.name,
        healthUnit: healthUnit.business_profile.name,

        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        patientName: patient.name,
        patientBirthdate: birthdate,
        patientMedicalInformation: patient?.medical_conditions || '',

        patientStreet: patient.address.street,
        patientCity: patient.address.city,
        patientPostalCode: patient.address.postal_code,
        patientCountry: patient.address.country,
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_order_accepted',
        userEmailPayload
      );

      if (
        !marketplaceNewOrderEmail ||
        !marketplaceNewOrderEmail.htmlBody ||
        !marketplaceNewOrderEmail.subject
      ) {
        return next(new HTTPError._500('Error while generating email template.'));
      }

      await OrdersController.SES.sendEmail(
        [customer.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );

      // Send email to all collaborators that have the 'orders_emails' permission
      if (collaboratorsEmails && collaboratorsEmails.length > 0) {
        for (let i = 0; i < collaboratorsEmails.length; i++) {
          const collaboratorEmail = collaboratorsEmails[i];
          if (collaboratorEmail) {
            let healthUnitEmailPayload = {
              name: collaborators[i].name,
              healthUnit: healthUnit.business_profile.name,

              userName: customer.name,
              userPhone: customer.phone,

              orderStart: orderStart,
              orderSchedule: schedule,
              orderServices: orderServices,

              patientName: patient.name,
              patientBirthdate: birthdate,
              patientMedicalInformation: patient?.medical_conditions || 'N/A',

              patientStreet: patient.address.street,
              patientCity: patient.address.city,
              patientPostalCode: patient.address.postal_code,
              patientCountry: patient.address.country,

              //link: `https://www.business.careplace.pt/app/orders/${order._id}`,
              link: `http://localhost:4000/app/orders/${order._id}/view`,
            };

            let businessNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
              'business_order_accepted',
              healthUnitEmailPayload
            );

            if (
              !businessNewOrderEmail ||
              !businessNewOrderEmail.htmlBody ||
              !businessNewOrderEmail.subject
            ) {
              return next(new HTTPError._500('Error while generating email template.'));
            }

            await OrdersController.SES.sendEmail(
              [collaboratorEmail],
              businessNewOrderEmail.subject,
              businessNewOrderEmail.htmlBody
            );
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

      let { decline_reason } = req.body as {
        decline_reason: string;
      };

      if (!decline_reason) {
        return next(new HTTPError._400('Missing decline reason.'));
      }

      let healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You are not authorized to decline this order.'));
        }
        return user.health_unit._id.toString();
      });

      let order: IHomeCareOrderDocument;
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
        next(new HTTPError._400('Missing required fields.'));
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
      }

      let healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        if (!('health_unit' in user)) {
          return next(new HTTPError._403('You are not authorized to decline this order.'));
        }
        return user.health_unit._id.toString();
      });

      let order: IHomeCareOrderDocument;

      try {
        order = await OrdersController.HomeCareOrdersDAO.queryOne({ _id: req.params.id }, [
          {
            path: 'patient',
            model: 'patient',
          },
          {
            path: 'health_unit',
            model: 'HealthUnit',
          },
          {
            path: 'services',
            model: 'Service',
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

      await OrdersController.HomeCareOrdersDAO.update(order);

      response.statusCode = 200;
      response.data = order;

      // Pass to the next middleware to handle the response
      next(response);

      /**
       * From 'services' array, get the services that are in the order
       */

      let orderServicesAux = order.services.map((serviceId) => {
        const service = services.find((service) => service._id.toString() === serviceId.toString());

        return service;
      });

      // Create a string with the services names
      // Example: "Cleaning, Laundry, Shopping"
      const orderServices = orderServicesAux
        .map((service) => {
          return service?.name;
        })
        .join(', ');

      let schedule = await DateUtils.getScheduleRecurrencyText(order.schedule_information.schedule);

      let birthdate = await DateUtils.convertDateToReadableString(
        (order.patient as IPatient).birthdate
      );

      let orderStart = await DateUtils.convertDateToReadableString2(
        order.schedule_information.start_date
      );
      let collaborators = (
        await OrdersController.CollaboratorsDAO.queryList({
          health_unit: { $eq: order.health_unit },
        })
      ).data;

      // Only send email to business users that have the 'orders_emails' permission
      collaborators = collaborators.filter((user) => {
        return user?.permissions?.includes('orders_emails');
      });

      const collaboratorsEmails = collaborators.map((user) => {
        if (user?.permissions?.includes('orders_emails')) {
          return user.email;
        }
      });

      let userEmailPayload = {
        name: (order.customer as ICustomer).name,
        healthUnit: order.health_unit.business_profile.name,

        link: `https://www.careplace.pt/checkout/orders/${order._id}`,

        subTotal: (order.order_total / 1.23 / 100).toFixed(2),
        taxAmount: ((order.order_total - order.order_total / 1.23) / 100).toFixed(2),
        total: (order.order_total / 100).toFixed(2),

        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: orderServices,

        patientName: (order.patient as IPatient).name,
        patientBirthdate: birthdate,
        patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'N/A',

        patientStreet: (order.patient as IPatient).address.street,
        patientCity: (order.patient as IPatient).address.city,
        patientPostalCode: (order.patient as IPatient).address.postal_code,
        patientCountry: (order.patient as IPatient).address.country,
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_quote_sent',
        userEmailPayload
      );

      if (
        !marketplaceNewOrderEmail ||
        !marketplaceNewOrderEmail.htmlBody ||
        !marketplaceNewOrderEmail.subject
      ) {
        return next(new HTTPError._500('Error while getting the email template.'));
      }

      await OrdersController.SES.sendEmail(
        [(order.customer as ICustomer).email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );

      // Send email to all collaborators that have the 'orders_emails' permission
      if (collaboratorsEmails && collaboratorsEmails.length > 0) {
        for (let i = 0; i < collaboratorsEmails.length; i++) {
          const collaboratorEmail = collaboratorsEmails[i];
          if (collaboratorEmail) {
            let healthUnitEmailPayload = {
              name: collaborators[i].name,
              healthUnit: order.health_unit.business_profile.name,

              link: `https://www.sales.careplace.pt/orders/${order._id}`,

              subTotal: (order.order_total / 1.23).toFixed(2),
              taxAmount: (order.order_total - order.order_total / 1.23).toFixed(2),
              total: order.order_total.toFixed(2),

              orderStart: orderStart,
              orderSchedule: schedule,
              orderServices: orderServices,

              patientName: (order.patient as IPatient).name,
              patientBirthdate: birthdate,
              patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'N/A',

              patientStreet: (order.patient as IPatient).address.street,
              patientCity: (order.patient as IPatient).address.city,
              patientPostalCode: (order.patient as IPatient).address.postal_code,
              patientCountry: (order.patient as IPatient).address.country,

              userName: (order.customer as ICustomer).name,
              userPhone: (order.customer as ICustomer).phone,
            };

            let businessNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
              'business_quote_sent',
              healthUnitEmailPayload
            );

            if (
              !businessNewOrderEmail ||
              !businessNewOrderEmail.htmlBody ||
              !businessNewOrderEmail.subject
            ) {
              return next(new HTTPError._500('Error while generating email template.'));
            }

            await OrdersController.SES.sendEmail(
              [collaboratorEmail],
              businessNewOrderEmail.subject,
              businessNewOrderEmail.htmlBody
            );
          }
        }
      }
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
