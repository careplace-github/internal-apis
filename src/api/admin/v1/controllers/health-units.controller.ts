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
        type: 'custom',
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

        business_profile: {
          // TODO: check if this is the correct MCC
          // 8050 - Nursing/Personal Care
          mcc: '8050',
          product_description: 'Healthcare',
          support_email: reqHealthUnit.business_profile.email,
          support_phone: reqHealthUnit.business_profile.phone,
          url: 'https://www.caregivers.pt',
        },
        business_type: 'company',
        company: {
          address: {
            city: reqHealthUnit.legal_information?.address?.city,
            country: reqHealthUnit.legal_information?.address?.country,
            line1: reqHealthUnit.legal_information?.address?.street,
            postal_code: reqHealthUnit.legal_information?.address?.postal_code,
            state: reqHealthUnit.legal_information?.address?.state,
          },
          phone: reqHealthUnit.business_profile.phone,
          directors_provided: true,
          executives_provided: true,
          owners_provided: true,
          name: reqHealthUnit.legal_information?.name,
          registration_number: reqHealthUnit.legal_information?.tax_number,
          tax_id: reqHealthUnit.legal_information?.tax_number,
          vat_id: reqHealthUnit.legal_information?.tax_number,
        },

        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          // accepted from our onboarding workshop
          ip: req.ip,
          user_agent: req.headers['user-agent'],
        },
      };

      // create a Stripe account
      try {
        stripeAccountId = (
          await AdminHealthUnitsController.StripeService.createConnectAccount(conectAccountParams)
        ).id;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      if (!stripeAccountId) {
        return next(new HTTPError._400('Error getting the stripe account id.'));
      }

      // create a representative in Stripe
      let stripeRepresentativeId: string | undefined;

      let representativeParams: Stripe.PersonCreateParams = {
        address: {
          city: reqHealthUnit.legal_information.director.address.city,
          country: reqHealthUnit.legal_information.director.address.country,
          line1: reqHealthUnit.legal_information.director.address.street,
          postal_code: reqHealthUnit.legal_information.director.address.postal_code,
          state: reqHealthUnit.legal_information.director.address.state,
        },
        dob: {
          day: new Date(reqHealthUnit.legal_information?.director?.birthdate).getDate(),
          month: new Date(reqHealthUnit.legal_information?.director?.birthdate).getMonth(),
          year: new Date(reqHealthUnit.legal_information?.director?.birthdate).getFullYear(),
        },
        email: reqHealthUnit.legal_information?.director?.email,
        first_name: reqHealthUnit.legal_information?.director?.name?.split(' ')[0],
        last_name: reqHealthUnit.legal_information?.director?.name?.split(' ')[1],
        phone: reqHealthUnit.legal_information?.director?.phone,
        id_number: reqHealthUnit.legal_information?.director?.id_number,

        relationship: {
          executive: true,
          representative: true,
          title: 'CEO',
          owner: true,
        },
      };

      try {
        stripeRepresentativeId = (
          await AdminHealthUnitsController.StripeService.createPerson(
            stripeAccountId,
            representativeParams
          )
        ).id;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      if (!stripeRepresentativeId) {
        return next(new HTTPError._400('Error getting the stripe representative id.'));
      }

      // create a customer in Stripe
      let stripeCustomerId: string | undefined;

      let customerParams: Stripe.CustomerCreateParams = {
        email: reqHealthUnit.business_profile.email,
        name: reqHealthUnit.legal_information.name,
        phone: reqHealthUnit.business_profile.phone,
        address: {
          city: reqHealthUnit.legal_information?.address?.city,
          country: reqHealthUnit.legal_information?.address?.country,
          line1: reqHealthUnit.legal_information?.address?.street,
          postal_code: reqHealthUnit.legal_information?.address?.postal_code,
          state: reqHealthUnit.legal_information?.address?.state,
        },
      };

      try {
        stripeCustomerId = (
          await AdminHealthUnitsController.StripeService.createCustomer(customerParams)
        ).id;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      newHealthUnit.stripe_information = {
        account_id: stripeAccountId,
        customer_id: stripeCustomerId,
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
      next(response);

      // If a bank account token was provided, add it to the account
      if (req.body.bank_account_token) {
        let bankAccount: Stripe.ExternalAccountCreateParams = {
          external_account: req.body.bank_account_token,
        };
        try {
          await AdminHealthUnitsController.StripeService.createExternalAccount(
            stripeAccountId,
            bankAccount
          );
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500('Internal server error.'));
          }
        }
      }
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

  static async adminRetrieveHealthUnit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const healthUnitId = req.params.id;

      let healthUnit: IHealthUnitDocument;

      try {
        healthUnit = await AdminHealthUnitsController.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Health unit not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      const connectAccountId = healthUnit.stripe_information?.account_id;
      let connectAccount: Stripe.Account | undefined;
      try {
        connectAccount = await AdminHealthUnitsController.StripeService.retrieveConnectAccount(
          connectAccountId
        );
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        ...healthUnit.toJSON(),
        stripe_account: connectAccount,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
