// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';
// secure-random-password
import password from 'secure-random-password';

// @api
import {
  CustomersDAO,
  HealthUnitsDAO,
  HealthUnitReviewsDAO,
  CollaboratorsDAO,
  HomeCareOrdersDAO,
} from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICollaboratorDocument,
  IHealthUnit,
  IHealthUnitDocument,
} from 'src/packages/interfaces';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { HTTPError, AuthUtils } from '@utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CaregiverModel, CollaboratorModel, HealthUnitModel } from '@packages/models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';
import { PATHS } from 'src/packages/routes';
import Stripe from 'stripe';

export default class AdminHealthUnitsController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();

  static CustomersDAO = new CustomersDAO();

  static CollaboratorsDAO = new CollaboratorsDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  // helpers
  static AuthHelper = AuthHelper;

  static EmailHelper = EmailHelper;

  // services
  static SES = SESService;
  static StripeService = StripeService;
  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);

  // utils
  static AuthUtils = AuthUtils;

  static async adminCreateHealthUnit(
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

      const reqHealthUnit = req.body as IHealthUnit;

      let healthUnitExists: IHealthUnitDocument | undefined;

      try {
        healthUnitExists = await AdminHealthUnitsController.HealthUnitsDAO.queryOne({
          'business_profile.email': reqHealthUnit.business_profile.email,
        });
      } catch (error) {
        // do nothing
      }

      if (healthUnitExists) {
        return next(new HTTPError._400('Health unit already exists.'));
      }

      let newHealthUnit = new HealthUnitModel(reqHealthUnit);

      // Validate the health unit data
      const validationError = newHealthUnit.validateSync({
        pathsToSkip: ['_id', 'stripe_information'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      // create an account in Stripe
      let stripeAccountId: string | undefined;

      let conectAccountParams: Stripe.AccountCreateParams = {
        type: 'express',
        country: 'PT',
        email: reqHealthUnit.business_profile.email,
        capabilities: {
          bancontact_payments: { requested: true },
          card_payments: { requested: true },
          eps_payments: { requested: true },
          giropay_payments: { requested: true },
          ideal_payments: { requested: true },
          link_payments: { requested: true },
          p24_payments: { requested: true },
          sepa_debit_payments: { requested: true },
          sofort_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          address: {
            city: reqHealthUnit.legal_information.address.city,
            country: reqHealthUnit.legal_information.address.country,
            line1: reqHealthUnit.legal_information.address.street,
            postal_code: reqHealthUnit.legal_information.address.postal_code,
            state: reqHealthUnit.legal_information.address.state,
          },
          directors_provided: true,
          executives_provided: true,
          owners_provided: true,
          name: reqHealthUnit.legal_information.name,
          registration_number: reqHealthUnit.legal_information.tax_number,
          tax_id: reqHealthUnit.legal_information.tax_number,
          vat_id: reqHealthUnit.legal_information.tax_number,
          structure: 'private_company',
        },
        individual: {
          address: {
            city: reqHealthUnit.legal_information.director.address.city,
            country: reqHealthUnit.legal_information.director.address.country,
            line1: reqHealthUnit.legal_information.director.address.street,
            postal_code: reqHealthUnit.legal_information.director.address.postal_code,
            state: reqHealthUnit.legal_information.director.address.state,
          },
          dob: {
            day: reqHealthUnit.legal_information.director.birthdate.getDate(),
            month: reqHealthUnit.legal_information.director.birthdate.getMonth(),
            year: reqHealthUnit.legal_information.director.birthdate.getFullYear(),
          },
          email: reqHealthUnit.legal_information.director.email,
          first_name: reqHealthUnit.legal_information.director.name.split(' ')[0],
          last_name: reqHealthUnit.legal_information.director.name.split(' ')[1],
          gender: reqHealthUnit.legal_information.director.gender,
          political_exposure: 'none',
        },
      };

      try {
        stripeAccountId = (
          await AdminHealthUnitsController.StripeService.createConnectAccount(conectAccountParams)
        ).id;
      } catch (error) {}

      if (!stripeAccountId) {
        return next(new HTTPError._400('Error getting the stripe account id.'));
      }

      newHealthUnit.stripe_information = {
        account_id: stripeAccountId,
        customer_id: '',
      };

      try {
        newHealthUnit = await AdminHealthUnitsController.HealthUnitsDAO.create(newHealthUnit);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      response.statusCode = 201;
      response.data = newHealthUnit;

      // Send the response
      return next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async adminUpdateHealthUnit(
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

      const healthUnitId = req.params.id;

      let healthUnit: IHealthUnitDocument | undefined;

      try {
        healthUnit = await AdminHealthUnitsController.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Health unit not found.'));
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      const reqHealthUnit = req.body as IHealthUnit;

      const sanitizedReqHealthUnit = omit(reqHealthUnit, ['_id']);

      const existingHealthIUnit = await AdminHealthUnitsController.HealthUnitsDAO.retrieve(
        healthUnitId
      );

      const newHealthUnit = new HealthUnitModel({
        ...existingHealthIUnit.toJSON(),
        ...sanitizedReqHealthUnit,
      });

      // Validate the health unit data
      const validationError = newHealthUnit.validateSync({
        pathsToSkip: ['_id', 'stripe_information'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let updatedHelahtUnit: IHealthUnitDocument | undefined;
      try {
        updatedHelahtUnit = await AdminHealthUnitsController.HealthUnitsDAO.update(newHealthUnit);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      response.statusCode = 200;
      response.data = updatedHelahtUnit;

      // Send the response
      return next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
