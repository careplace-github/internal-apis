// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, Types, startSession } from 'mongoose';

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
} from '@api/v1/db';
import { AuthHelper, EmailHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICaregiver,
  ICaregiverModel,
  IHealthUnit,
  IHealthUnitModel,
  ICustomer,
  IEventSeries,
  IHomeCareOrder,
  IHomeCareOrderModel,
  IPatient,
  IService,
  IServiceModel,
} from '@api/v1/interfaces';
import { EventSeriesModel, HomeCareOrderModel, ServiceModel } from '@api/v1/models';
import { CognitoService, SESService } from '@api/v1/services';
import { HTTPError, AuthUtils, DateUtils } from '@api/v1/utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
// @data
import { services } from '@assets';

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
  // utils
  static AuthUtils = AuthUtils;
  static DateUtils = DateUtils;

  // -------------------------------------------------- //
  //                     CUSTOMER                       //
  // -------------------------------------------------- //

  static async customerCreateHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let order = req.body as IHomeCareOrder;
      let patient: IPatient;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user = await AuthHelper.getUserFromDB(accessToken);

      try {
        patient = await this.PatientsDAO.queryOne(
          { user: user._id },
          {
            path: 'user',
            model: 'marketplace_user',
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

      let healthUnit: IHealthUnitModel;
      try {
        healthUnit = await this.HealthUnitsDAO.queryOne({ _id: order.health_unit });
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

      let orderCreated = await this.HomeCareOrdersDAO.create(newOrder);

      response.statusCode = 200;
      response.data = orderCreated;

      // Pass to the next middleware to handle the response
      next(response);

      /**
       * From 'services' array, get the services that are in the order
       */
      let orderServices: IServiceModel[] = [];

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

      let schedule = await this.DateUtils.getScheduleRecurrencyText(
        order?.schedule_information?.schedule
      );

      let birthdate = await this.DateUtils.convertDateToReadableString(patient.birthdate);

      let orderStart = await this.DateUtils.convertDateToReadableString2(
        order?.schedule_information?.start_date
      );

      let userEmailPayload = {
        name: user.name,
        healthUnit: healthUnit?.business_profile?.name,
        orderStart: orderStart,
        orderSchedule: schedule,
        orderServices: servicesNames,

        patientName: patient.name,
        patientBirthdate: birthdate,
        patientMedicalInformation: patient?.medical_conditions || 'N/A',

        patientStreet: patient.address.street,
        patientCity: patient.address.city,
        patientPostalCode: patient.address.postal_code,
        patientCountry: patient.address.country,
      };

      let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
        'marketplace_new_order',
        userEmailPayload
      );

      if (
        !marketplaceNewOrderEmail ||
        !marketplaceNewOrderEmail.htmlBody ||
        !marketplaceNewOrderEmail.subject
      ) {
        return next(new HTTPError._500('Error getting email template'));
      }

      await this.SES.sendEmail(
        [user.email],
        marketplaceNewOrderEmail.subject,
        marketplaceNewOrderEmail.htmlBody
      );

      let collaborators = (
        await this.CollaboratorsDAO.queryList({
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
          name: collaborators[i].name,
          healthUnit: healthUnit!.business_profile!.name,

          /**
           * @todo Change this link to the correct one
           */
          link: `https://www.sales.careplace.pt/orders/${orderCreated._id}`,
        };

        let businessNewOrderEmail = await this.EmailHelper.getEmailTemplateWithData(
          'business_new_order',
          healthUnitEmailPayload
        );

        if (!businessNewOrderEmail || !businessNewOrderEmail.htmlBody || !businessNewOrderEmail.subject) {
          return next(new HTTPError._500('Error getting email template'));
        }

        await this.SES.sendEmail(
          collaboratorsEmails,
          businessNewOrderEmail.subject,
          businessNewOrderEmail.htmlBody
        );
      }
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveCustomerHomeCareOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };
      let order: IHomeCareOrder;

      const orderId = req.params.id;

      let user;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      try {
        order = await this.HomeCareOrdersDAO.retrieve(
          orderId,

          // Populate the fields patient and caregiver
          [
            {
              path: 'patient',
            },
            {
              path: 'caregiver',
            },
            {
              path: 'services',
            },
            {
              path: 'health_unit',
            },
            {
              path: 'user',
              model: 'marketplace_user',
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

      response.statusCode = 200;
      response.data = order;

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
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let homeCareOrders: IHomeCareOrderModel[] = [];

      let user;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      try {
        homeCareOrders = (
          await this.HomeCareOrdersDAO.queryList(
            {
              user: user._id,
            },
            undefined,
            undefined,
            undefined,
            // Populate the fields patient and caregiver
            [
              {
                path: 'patient',
              },
              {
                path: 'caregiver',
              },
              {
                path: 'services',
              },
              {
                path: 'health_unit',
              },
            ]
          )
        ).data;
      } catch (error: any) {
        switch (error.type) {
          default:
            next(new HTTPError._500(error.message));
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

  // -------------------------------------------------- //
  //                     HEALTH UNIT                    //
  // -------------------------------------------------- //

  /**
   * @todo
   */
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

  /**
   * @todo
   */
  static async healthUnitRetrieveHomeCareOrder(
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

  /**
   * @todo
   */
  static async healthUnitUpdateHomeCareOrder(
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

  static async listHealthUnitHomeCareOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };
      let healthUnitId: string;
      let homeCareOrders: IHomeCareOrderModel[] = [];

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

      try {
        let user = await AuthHelper.getUserFromDB(accessToken);
        healthUnitId = user.health_unit;
      } catch (error: any) {
        switch (error.type) {
          default:
            throw new HTTPError._500(error.message);
        }
      }

      try {
        homeCareOrders = (
          await this.HomeCareOrdersDAO.queryList(
            {
              health_unit: { $eq: healthUnitId },
            },

            undefined,
            undefined,
            undefined,

            [
              {
                path: 'user',
                model: 'marketplace_user',
                select: '-_id -stripe_information -settings -cognito_id -createdAt -updatedAt -__v',
              },
              {
                path: 'patient',
                model: 'patient',
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
        statusCode: 102, // request received
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
        throw new HTTPError._400('Missing caregiver.');
      }

      let caregiverExists: ICaregiverModel;
      try {
        caregiverExists = await this.CaregiversDAO.retrieve(caregiver);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Caregiver not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      let healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
        return user.health_unit._id;
      });

      let order: IHomeCareOrderModel;
      try {
        order = await this.HomeCareOrdersDAO.retrieve(req.params.id);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (healthUnitId.toString() !== order?.health_unit?.toString()) {
        return next(new HTTPError._403('You are not authorized to accept this order.'));
      }

      if (order.status !== 'new') {
        return next(new HTTPError._400('You cannot accept this order.'));
      }

      order.status = 'accepted';
      order.caregiver = caregiverExists._id as Types.ObjectId;

      try {
        await this.HomeCareOrdersDAO.update(order);
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
      let patient = await this.PatientsDAO.queryOne({ _id: order.patient });
      let healthUnit = await this.HealthUnitsDAO.queryOne({ _id: order.health_unit });
      let customer = await this.CustomersDAO.queryOne({ _id: order.customer });

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

        let eventSeriesAdded = await this.EventSeriesDAO.create(newEventSeries);
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
        await this.CollaboratorsDAO.queryList({
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

      await this.SES.sendEmail(
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

            if (!businessNewOrderEmail || !businessNewOrderEmail.htmlBody || !businessNewOrderEmail.subject) {
              return next(new HTTPError._500('Error while generating email template.'));
            }

            await this.SES.sendEmail(
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

  /**
   * @todo
   */
  static async declineHomeCareOrder(
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

  static async sendHomeCareOrderQuote(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
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

      let healthUnitId = user.health_unit._id;

      let order: IHomeCareOrderModel;

      try {
        order = await this.HomeCareOrdersDAO.queryOne({ _id: req.params.id }, [
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
            path: 'user',
            model: 'marketplace_user',
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
        healthUnitId.toString() !== order.health_unit._id.toString() ||
        !user?.permissions?.includes('orders_edit')
      ) {
        throw new HTTPError._403('You are not authorized to send a quote for this order.');
      }

      if (
        order.status === 'declined' ||
        order.status === 'cancelled' ||
        order.status === 'completed'
      ) {
        throw new HTTPError._403('You are not authorized to send a quote for this order.');
      }

      order.order_total = order_total;

      await this.HomeCareOrdersDAO.update(order);

      response = {
        statusCode: 200,
        data: order,
      };

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
        await this.CollaboratorsDAO.queryList({
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
        throw new HTTPError._500('Error while getting the email template.');
      }

      await this.SES.sendEmail(
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

            if (!businessNewOrderEmail || !businessNewOrderEmail.htmlBody || !businessNewOrderEmail.subject) {
              return next(new HTTPError._500('Error while generating email template.'));
            }

            await this.SES.sendEmail(
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
