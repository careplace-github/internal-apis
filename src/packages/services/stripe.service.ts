// stripe
import Stripe from 'stripe';

// @api
import { LayerError } from '@utils';

// @constants
import { STRIPE_SECRET_KEY } from '@constants';
// @logger
import logger from '@logger';

/**
 * Class to manage the `
 * Stripe API`
 *
 * @documentation https://stripe.com/docs/api
 */

// FIXME Check the Stripe Error Api Response and update the error handling accordingly
// TODO Add request logging - missing word 'params'
// TODO Add response logging

export default class StripeService {
  static Stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });

  // -------------------------------------------------------------------------------------------- //
  //                                      PAYMENT METHODS                                         //
  //                                                                                              //
  // @see https://stripe.com/docs/api/payment_methods?lang=node                                   //
  // -------------------------------------------------------------------------------------------- //

  /**
   * Returns a list of PaymentMethods for a given Customer
   *
   * @param {String} customerId - The ID of the customer to retrieve the payment methods for.
   * @param {String} type - The type of payment method. An optional filter on the list, based on the object type field. Without the filter, the list includes all current and future payment method types. If your integration expects only one type of payment method in the response, make sure to provide a type value in the request.
   * @returns {Promise<JSON>} - A object with a data property that contains an array of up to limit PaymentMethods of type type, starting after PaymentMethods starting_after. Each entry in the array is a separate PaymentMethod object. If no more PaymentMethods are available, the resulting array will be empty. This request should never throw an error.
   *
   * @see https://stripe.com/docs/api/payment_methods/customer_list?lang=node
   */
  static async listPaymentMethods(
    customerId: string,
    params?: Stripe.CustomerListPaymentMethodsParams
  ): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    let paymentMethods: Stripe.ApiList<Stripe.PaymentMethod>;

    logger.info('StripeService.listPaymentMethods params: ', { customerId, params });

    try {
      paymentMethods = await this.Stripe.customers.listPaymentMethods(customerId, params);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.listPaymentMethods response: ', { paymentMethods });

    return paymentMethods;
  }

  static async updateBankAccount(
    externalAccountId: string,
    bankAccountId: string,
    params: Stripe.ExternalAccountUpdateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.BankAccount> {
    logger.info('StripeService.updateBankAccount params: ', {
      externalAccountId,
      params,
    });

    let bankAccount: Stripe.BankAccount;

    try {
      bankAccount = (await this.Stripe.accounts.updateExternalAccount(
        externalAccountId,
        bankAccountId,
        params,
        options
      )) as Stripe.BankAccount;
    } catch (error: any) {
      logger.error('StripeService.updateBankAccount Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.updateBankAccount return: ', { bankAccount });

    return bankAccount;
  }

  static async updateConnectAccount(
    accountId: string,
    params: Stripe.AccountUpdateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Account> {
    logger.info('StripeService.updateConnectAccount params: ' + { accountId, params, options });

    let account: Stripe.Account;

    try {
      account = await this.Stripe.accounts.update(accountId, params, options);
    } catch (error: any) {
      logger.error('StripeService.updateConnectAccount Error: ' + error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.updateConnectAccount return: ' + { account });

    return account;
  }

  static async retrieveExternalAccount(
    accountId: string,
    externalAccountId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.BankAccount | Stripe.Card> {
    logger.info('StripeService.retrieveExternalAccount params: ', {
      accountId,
      externalAccountId,
      options,
    });

    let externalAccount: Stripe.BankAccount | Stripe.Card;

    try {
      externalAccount = await this.Stripe.accounts.retrieveExternalAccount(
        accountId,
        externalAccountId,
        options
      );
    } catch (error: any) {
      logger.error('StripeService.retrieveExternalAccount Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.retrieveExternalAccount return: ', { externalAccount });

    return externalAccount;
  }

  static async retrieveConnectAccount(
    accountId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Account> {
    logger.info('StripeService.retrieveConnectAccount params: ', { accountId, options });

    let account: Stripe.Account;

    try {
      account = await this.Stripe.accounts.retrieve(accountId, options);
    } catch (error: any) {
      logger.error('StripeService.retrieveConnectAccount Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.retrieveConnectAccount return: ', { account });

    return account;
  }

  static async deleteConnectAccount(
    accountId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.DeletedAccount> {
    logger.info('StripeService.deleteConnectAccount params: ', { accountId, options });

    let account: Stripe.DeletedAccount;

    try {
      account = await this.Stripe.accounts.del(accountId, options);
    } catch (error: any) {
      logger.error('StripeService.deleteConnectAccount Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.deleteConnectAccount return: ', { account });

    return account;
  }

  static async createBankAccountToken(
    params: Stripe.TokenCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Token> {
    logger.info('StripeService.createBankAccountToken params: ', { params, options });

    let bankAccountToken: Stripe.Token;

    try {
      bankAccountToken = await this.Stripe.tokens.create(params, options);
    } catch (error: any) {
      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.createBankAccountToken return: ', { bankAccountToken });

    return bankAccountToken;
  }

  static async createConnectAccount(
    params: Stripe.AccountCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Account> {
    logger.info(`StripeService.createConnectAccount params: ${JSON.stringify(params, null, 2)}`);

    let account: Stripe.Account;

    try {
      account = await this.Stripe.accounts.create(params, options);
    } catch (error: any) {
      logger.error('StripeService.createConnectAccount Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`StripeService.createConnectAccount return: ${JSON.stringify(account, null, 2)}`);

    return account;
  }

  static async retrievePaymentMethod(
    paymentMethodId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.PaymentMethod> {
    let paymentMethod: Stripe.PaymentMethod;

    logger.info('StripeService.retrievePaymentMethod params: ', { paymentMethodId, options });

    try {
      paymentMethod = await this.Stripe.paymentMethods.retrieve(paymentMethodId, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.retrievePaymentMethod return: ', { paymentMethod });

    return paymentMethod;
  }

  static async createPaymentMethodWithToken(
    params: Stripe.PaymentMethodCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.PaymentMethod> {
    logger.info('StripeService.createPaymentMethodWithToken params: ', { params, options });

    let paymentMethod: Stripe.PaymentMethod;

    try {
      paymentMethod = await this.Stripe.paymentMethods.create(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.createPaymentMethodWithToken return: ', { paymentMethod });

    return paymentMethod;
  }

  static async deletePaymentMethod(
    paymentMethodId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.PaymentMethod> {
    logger.info('StripeService.deletePaymentMethod params: ', { paymentMethodId, options });

    let paymentMethod: Stripe.PaymentMethod;

    try {
      paymentMethod = await this.Stripe.paymentMethods.detach(paymentMethodId, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.deletePaymentMethod return: ', { paymentMethod });

    return paymentMethod;
  }

  static async attachPaymentMethodToCustomer(
    paymentMethodId: string,
    customerId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.PaymentMethod> {
    logger.info('StripeService.attachPaymentMethodToCustomer params: ', {
      paymentMethodId,
      options,
    });

    let paymentMethod: Stripe.PaymentMethod;

    try {
      paymentMethod = await this.Stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        },
        options
      );
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.attachPaymentMethodToCustomer return: ', { paymentMethod });

    return paymentMethod;
  }

  /**
   * You can see a list of the bank accounts that belong to a connected account. Note that the 10 most recent external accounts are always available by default on the corresponding Stripe object. If you need more than those 10, you can use this API method and the limit and starting_after parameters to page through additional bank accounts.
   *
   * @param {String} accountId - The ID of the account to list the bank accounts for.
   * @returns {Promise<JSON>} - Returns a list of the bank accounts stored on the account.
   *
   * @see https://stripe.com/docs/api/external_account_bank_accounts/list?lang=node
   */
  static async listExternalAccounts(
    accountId: string
  ): Promise<Stripe.ApiList<Stripe.BankAccount>> {
    let bankAccounts: Stripe.ApiList<Stripe.BankAccount>;

    try {
      bankAccounts = (await this.Stripe.accounts.listExternalAccounts(accountId, {
        object: 'bank_account',
      })) as Stripe.ApiList<Stripe.BankAccount>;
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return bankAccounts;
  }

  static async createPerson(
    accountId: string,
    params: Stripe.PersonCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Person> {
    logger.info(
      'StripeService.createPerson params: ',
      JSON.stringify({ accountId, params, options }, null, 2)
    );

    let person: Stripe.Person;

    try {
      person = await this.Stripe.accounts.createPerson(accountId, params, options);
    } catch (error: any) {
      logger.error('StripeService.createPerson Error: ', error);
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.createPerson return: ', JSON.stringify(person, null, 2));

    return person;
  }

  static async createExternalAccount(
    accountId: string,
    params: Stripe.ExternalAccountCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.BankAccount> {
    let bankAccount: Stripe.BankAccount;

    logger.info(
      'StripeService.createExternalAccount params: ' +
        JSON.stringify({ accountId, params, options }, null, 2)
    );

    try {
      bankAccount = (await this.Stripe.accounts.createExternalAccount(
        accountId,
        params,
        options
      )) as Stripe.BankAccount;
    } catch (error: any) {
      logger.error('StripeService.createExternalAccount Error: ', error);
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'StripeService.createExternalAccount return: ' + JSON.stringify(bankAccount, null, 2)
    );

    return bankAccount;
  }
  static async deleteExternalAccount(
    accountId: string,
    externalAccountId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.DeletedBankAccount> {
    let bankAccount: Stripe.DeletedBankAccount;

    logger.info(
      'StripeService.deleteExternalAccount params: ' +
        JSON.stringify({ accountId, externalAccountId, options }, null, 2)
    );

    try {
      bankAccount = (await this.Stripe.accounts.deleteExternalAccount(
        accountId,
        externalAccountId,
        options
      )) as Stripe.DeletedBankAccount;
    } catch (error: any) {
      logger.error('StripeService.deleteExternalAccount Error: ', error);
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'StripeService.deleteExternalAccount return: ' + JSON.stringify(bankAccount, null, 2)
    );

    return bankAccount;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                        CORE RESOURCES                                        //
  //                                                                                              //
  // @see https://stripe.com/docs/api/balance?lang=node                                           //
  // -------------------------------------------------------------------------------------------- //

  /**
   * Creates a customer object.
   *
   * @param {JSON} customer - The customer object to create.
   * @returns Returns the customer object if the update succeeded. Throws an error if create parameters are invalid (e.g. specifying an invalid coupon or an invalid source).
   *
   * @see https://stripe.com/docs/api/customers/create?lang=node
   */
  static async createCustomer(
    params: Stripe.CustomerCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Customer> {
    logger.info(`StripeService.createCustomer${JSON.stringify({ params, options }, null, 2)}`);

    let createdCustomer: Stripe.Customer;

    try {
      createdCustomer = await this.Stripe.customers.create(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`StripeService.createCustomer return: ${JSON.stringify(createdCustomer, null, 2)}`);

    return createdCustomer;
  }

  static async retrieveCustomer(
    customerId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    logger.info('StripeService.retrieveCustomer', { customerId, options });

    let customer: Stripe.Customer | Stripe.DeletedCustomer;

    try {
      customer = await this.Stripe.customers.retrieve(customerId, options);
    } catch (error: any) {
      logger.error('StripeService.retrieveCustomer Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.retrieveCustomer return: ', { customer });

    return customer;
  }

  static async deleteCustomer(
    customerId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.DeletedCustomer> {
    logger.info('StripeService.deleteCustomer', { customerId, options });

    let customer: Stripe.DeletedCustomer;

    try {
      customer = await this.Stripe.customers.del(customerId, options);
    } catch (error: any) {
      logger.error('StripeService.deleteCustomer Error: ', error);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.deleteCustomer return: ', { customer });

    return customer;
  }

  /**
   * Returns a list of your customers. The customers are returned sorted by creation date, with the most recent customers appearing first.
   *
   * @returns {Promise<JSON>} - A object with a data property that contains an array of up to limit customers, starting after customer starting_after. Passing an optional email will result in filtering to customers with only that exact email address. Each entry in the array is a separate customer object. If no more customers are available, the resulting array will be empty. This request should never throw an error.
   *
   * @see https://stripe.com/docs/api/customers/list?lang=node
   */
  static async listCustomers(
    params?: Stripe.CustomerListParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.Customer>> {
    logger.info('StripeService.listCustomers', { params, options });

    let customers: Stripe.ApiList<Stripe.Customer>;

    try {
      customers = await this.Stripe.customers.list(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return customers;
  }

  /**
   * Retrieves a Customer object.
   *
   * @param {String} customerId - The ID of the customer to retrieve.
   * @returns {Promise<JSON>} - Returns the Customer object for a valid identifier. If it’s for a deleted Customer, a subset of the customer’s information is returned, including a deleted property that’s set to true.
   *
   * @see https://stripe.com/docs/api/customers/retrieve?lang=node
   */
  static async getCustomer(
    customerId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Customer> {
    logger.info('StripeService.getCustomer', { customerId, options });

    let customer: Stripe.Customer;

    try {
      customer = (await this.Stripe.customers.retrieve(customerId, options)) as Stripe.Customer;

      if (customer.deleted) {
        throw new LayerError.NOT_FOUND('Customer not found');
      }
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return customer;
  }

  static async createCustomerTaxId(
    customerId: string,
    params: Stripe.TaxIdCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.TaxId> {
    logger.info('StripeService.createCustomerTaxId', { customerId, params, options });

    let customerTaxId: Stripe.TaxId;

    try {
      customerTaxId = await this.Stripe.customers.createTaxId(customerId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return customerTaxId;
  }

  /**
   * Creates a single-use token that represents a credit card’s details. This token can be used in place of a credit card object with any API method. These tokens can be used only once: by creating a new Charge object, or by attaching them to a Customer object.
   *
   * @param {Card} card - The card this token will represent. If you also pass in a customer, the card must be the ID of a card belonging to the customer. Otherwise, if you do not pass in a customer, this is an object containing a user's credit card details, with the options described below.
   * @returns {Promise<JSON>} - Returns the created card token if successful. Otherwise, this call throws an error.
   */
  static async createCardToken(
    params: Stripe.TokenCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Token> {
    logger.info(`StripeService.createCardToken${JSON.stringify({ params, options }, null, 2)}`);

    let cardToken: Stripe.Token;

    try {
      cardToken = await this.Stripe.tokens.create(params, options);
    } catch (error: any) {
      logger.error(`StripeService.createCardToken Error: ${error}`);

      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`StripeService.createCardToken return: ${{ cardToken }}`);

    return cardToken;
  }

  /**
   * Retrieves the token with the given ID.
   *
   * @param {String} tokenId
   * @returns Returns a token if a valid ID was provided. Throws an error otherwise.
   *
   * @see https://stripe.com/docs/api/tokens/retrieve?lang=node
   */
  static async retrieveToken(
    tokenId: string,
    params?: Stripe.TokenRetrieveParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Token> {
    logger.info('StripeService.retrieveToken', { tokenId, params, options });

    let token: Stripe.Token;

    try {
      token = await this.Stripe.tokens.retrieve(tokenId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return token;
  }

  /**
   * Retrieves the details of a charge that has previously been created. Supply the unique charge ID that was returned from your previous request, and Stripe will return the corresponding charge information. The same information is returned when creating or refunding the charge.
   *
   * @param {String} chargeId - The ID of the charge to retrieve.
   * @returns {Promise<JSON>} - Returns a charge if a valid identifier was provided, and throws an error otherwise.
   *
   * @see https://stripe.com/docs/api/charges/retrieve?lang=node
   */
  static async getCharge(
    chargeId: string,
    params?: Stripe.ChargeRetrieveParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Charge> {
    logger.info('StripeService.getCharge', { chargeId, params, options });

    let charge: Stripe.Charge;

    try {
      charge = await this.Stripe.charges.retrieve(chargeId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return charge;
  }

  static async listCharges(
    params?: Stripe.ChargeListParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.Charge>> {
    logger.info(`StripeService.listCharges: ${JSON.stringify({ params, options }, null, 2)}`);

    let charges: Stripe.ApiList<Stripe.Charge>;

    try {
      charges = await this.Stripe.charges.list(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return charges;
  }

  /**
   * Search for charges you’ve previously created using Stripe’s Search Query Language. Don’t use search in read-after-write flows where strict consistency is necessary. Under normal operating conditions, data is searchable in less than a minute. Occasionally, propagation of new or updated data can be up to an hour behind during outages. Search functionality is not available to merchants in India.
   *
   * @param {JSON} query - The search query string. See search query language and the list of supported query fields for charges.
   * @param {String} limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {String} page - A cursor for pagination across multiple pages of results. Don’t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @returns - A dictionary with a data property that contains an array of up to limit charges. If no objects match the query, the resulting array will be empty. See the related guide on expanding properties in lists.
   *
   * @see https://stripe.com/docs/api/charges/search?lang=node
   */
  static async getChargesByQuery(
    params: Stripe.ChargeSearchParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Response<Stripe.ApiSearchResult<Stripe.Charge>>> {
    logger.info('StripeService.getChargesByQuery', { params, options });

    let charges: Stripe.Response<Stripe.ApiSearchResult<Stripe.Charge>>;

    try {
      charges = await this.Stripe.charges.search(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return charges;
  }

  static async listPromotionCodes(
    params?: Stripe.PromotionCodeListParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.PromotionCode>> {
    logger.info('StripeService.listPromotionCodes', { params, options });

    let promotionCodes: Stripe.ApiList<Stripe.PromotionCode>;

    try {
      promotionCodes = await this.Stripe.promotionCodes.list(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return promotionCodes;
  }

  static async getPromotionCode(
    promotionCodeId: string,
    params?: Stripe.PromotionCodeRetrieveParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.PromotionCode> {
    logger.info('StripeService.getPromotionCode', {
      promotionCodeId,
      params,
      options,
    });

    let promotionCode: Stripe.PromotionCode;

    try {
      promotionCode = await this.Stripe.promotionCodes.retrieve(promotionCodeId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return promotionCode;
  }

  /**
   *  Constructs an event object from a request body and signature.
   *
   * @param {Object} event - The event object
   * @param {String} signature - The signature of the event
   * @param {String} endpointSecret - The endpoint secret of the webhook
   * @returns {Promise<JSON>} - Returns an event object if a valid identifier was provided. All events share a common structure, detailed to the right. The only property that will differ is the data property.
   *
   * @see https://stripe.com/docs/webhooks/signatures?lang=node
   */
  static async constructEvent(
    payload: string | Buffer,
    signature: string | string[] | Buffer,
    secret: string,
    tolerance?: number | undefined,
    cryptoProvider?: Stripe.CryptoProvider | undefined
  ): Promise<Stripe.Event> {
    logger.info(
      `StripeService.constructEvent${JSON.stringify(
        { payload, header: signature, secret, tolerance, cryptoProvider },
        null,
        2
      )}`
    );

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = this.Stripe.webhooks.constructEvent(
        payload,
        signature,
        secret,
        tolerance,
        cryptoProvider
      );
    } catch (error: any) {
      switch (error.type) {
        case 'StripeSignatureVerificationError':
          throw new LayerError.INVALID_PARAMETER(error.type);
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`Stripe Event: ${JSON.stringify(stripeEvent, null, 2)}`);

    return stripeEvent;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                          BIILING                                             //
  //                                                                                              //
  // @see https://stripe.com/docs/api/subscriptions?lang=node                                     //
  // -------------------------------------------------------------------------------------------- //

  static async createPrice(
    params: Stripe.PriceCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Price> {
    logger.info(`StripeService.createPrice${JSON.stringify(params, null, 2)}`);

    let price: Stripe.Price;

    try {
      price = await this.Stripe.prices.create(params, options);
    } catch (error: any) {
      switch (error.type) {
        case 'StripeCardError':
          throw new LayerError.INVALID_PARAMETER(error.message);
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`StripeService.createPrice return: ${JSON.stringify(price, null, 2)}`);

    return price;
  }

  /**
   * Creates a new subscription on an existing customer. Each customer can have up to 500 active or scheduled subscriptions.
   * When you create a subscription with collection_method=charge_automatically, the first invoice is finalized as part of the request. The payment_behavior parameter determines the exact behavior of the initial payment.
   * To start subscriptions where the first invoice always begins in a draft status, use subscription schedules instead. Schedules provide the flexibility to model more complex billing configurations that change over time.
   *
   * @param {String} customerId - The ID of the customer to create a subscription for.
   * @param {String} priceId - The ID of the price to subscribe the customer to.
   * @param {String} transferAccount - The ID of the connected account that should receive the funds from the subscription. Only applicable if the application fee percentage is set. See the Connect documentation for details.
   * @param {Number} applicationFee - A positive decimal (with at most two decimal places) between 1 and 100. This represents the percentage of the subscription invoice subtotal that will be transferred to the application owner’s Stripe account. The request must be made with an OAuth key or the Stripe-Account header in order to take an application fee. For more information, see the application fees documentation.
   * @param {String} paymentMethod - The ID of the PaymentMethod to attach to the subscription. If not provided, defaults to the default payment method in the customer’s invoice settings.
   * @returns {Promise<JSON>} - The newly created Subscription object, if the call succeeded. If the attempted charge fails, the subscription is created in an incomplete status.
   *
   * @see https://stripe.com/docs/api/subscriptions/create?lang=node
   * @see https://stripe.com/docs/connect/subscriptions
   */
  static async createSubscription(
    params: Stripe.SubscriptionCreateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Subscription> {
    logger.info(`StripeService.createSubscription_ `, JSON.stringify(params, null, 2));

    let subscription: Stripe.Subscription;

    try {
      subscription = await this.Stripe.subscriptions.create(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      `StripeService.createSubscription return: ${JSON.stringify(subscription, null, 2)}`
    );

    return subscription;
  }

  static async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Subscription> {
    logger.info('StripeService.updateSubscription', { subscriptionId, params, options });

    let subscription: Stripe.Subscription;

    try {
      subscription = await this.Stripe.subscriptions.update(subscriptionId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return subscription;
  }

  static async cancelSubscription(
    subscriptionId: string,
    params?: Stripe.SubscriptionCancelParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Subscription> {
    logger.info(`StripeService.cancelSubscription${{ subscriptionId, params, options }}`);

    let subscription: Stripe.Subscription;

    try {
      subscription = await this.Stripe.subscriptions.del(subscriptionId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return subscription;
  }

  /**
   * When a subscription is created it automatically tries to charge the customer's default payment method.
   * This function should try to charge the customer's default payment method again if the first attempt failed due to a card error.
   */
  static async chargeInvoice(
    invoiceId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Invoice> {
    logger.info('StripeService.retryInvoice', { invoiceId, options });

    let invoice: Stripe.Invoice;

    try {
      invoice = await this.Stripe.invoices.pay(invoiceId, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return invoice;
  }

  static async getCustomerTaxIds(
    customerId: string,
    params?: Stripe.TaxIdListParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.TaxId>> {
    logger.info('StripeService.getCustomerTaxIds', { customerId, params, options });

    let taxIds: Stripe.ApiList<Stripe.TaxId>;

    try {
      taxIds = await this.Stripe.customers.listTaxIds(customerId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return taxIds;
  }

  /**
   * Retrieves the subscription with the given ID.
   *
   * @param {String} subscriptionId - The ID of the subscription to retrieve.
   * @returns {Promise<JSON>} - Returns the subscription object.
   *
   * @see https://stripe.com/docs/api/subscriptions/retrieve?lang=node
   */
  static async getSubscription(
    subscriptionId: Stripe.Subscription['id']
  ): Promise<Stripe.Subscription> {
    logger.info('StripeService.getSubscription', { subscriptionId });

    let subscription: Stripe.Subscription;

    try {
      subscription = await this.Stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return subscription;
  }

  /**
   * Search for subscriptions you’ve previously created using Stripe’s Search Query Language. Don’t use search in read-after-write flows where strict consistency is necessary. Under normal operating conditions, data is searchable in less than a minute. Occasionally, propagation of new or updated data can be up to an hour behind during outages. Search functionality is not available to merchants in India.
   *
   * @param {JSON} query - The search query string. See search query language and the list of supported query fields for subscriptions.
   * @param {Number} limit - A limit on the number of objects to be returned. Limit can range between 1 and 100 items, and the default is 10 items.
   * @param {Number} page - A cursor for use in pagination. ending_before is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with obj_bar, your subsequent call can include ending_before=obj_bar in order to fetch the previous page of the list.
   * @returns {Promise<JSON>} - Returns a list of subscriptions matching the search query.
   *
   * @see https://stripe.com/docs/api/subscriptions/search?lang=node
   * @see https://stripe.com/docs/search#search-query-language
   */
  static async getSubscriptionsByQuery(
    params: Stripe.SubscriptionSearchParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiSearchResult<Stripe.Subscription>> {
    logger.info('StripeService.getSubscriptionsByQuery', { params, options });

    let subscriptions: Stripe.ApiSearchResult<Stripe.Subscription>;

    try {
      subscriptions = await this.Stripe.subscriptions.search(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return subscriptions;
  }

  static async listSubscriptions(
    params: Stripe.SubscriptionListParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.Subscription>> {
    logger.info(`StripeService.listSubscriptions: ${JSON.stringify({ params, options }, null, 2)}`);

    let subscriptions: Stripe.ApiList<Stripe.Subscription>;

    try {
      subscriptions = await this.Stripe.subscriptions.list(params, options);
    } catch (error: any) {
      logger.error('StripeService.listSubscriptions error: ', error);
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('StripeService.listSubscriptions return: ', JSON.stringify(subscriptions, null, 2));

    return subscriptions;
  }

  /**
   * @todo Move to StripeHelper
   *
   * Returns a list of subscriptions for a customer.
   *
   * @param {String} customerId - The ID of the customer to retrieve the subscriptions for.
   * @returns {Promise<JSON>} - Returns a list of the customer's subscriptions. You can optionally request that the response include the total count of all subscriptions for the customer. To do so, specify include[]=total_count in your request.
   *
   * @see https://stripe.com/docs/api/subscriptions/list?lang=node
   */
  static async getCustomerSubscriptions(
    customerId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.Subscription>> {
    logger.info('StripeService.getCustomerSubscriptions', { customerId, options });

    let subscriptions: Stripe.ApiList<Stripe.Subscription>;

    try {
      subscriptions = await this.Stripe.subscriptions.list(
        {
          customer: customerId,
        },
        options
      );
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return subscriptions;
  }

  /**
   * Retrieves the invoice with the given ID.
   *
   * @param {String} invoiceId - The ID of the invoice to retrieve.
   * @returns {Promise<JSON>} - Returns an invoice object if a valid invoice ID was provided. Throws an error otherwise.
   * The invoice object contains a lines hash that contains information about the subscriptions and invoice items that have been applied to the invoice, as well as any prorations that Stripe has automatically calculated. Each line on the invoice has an amount attribute that represents the amount actually contributed to the invoice’s total. For invoice items and prorations, the amount attribute is the same as for the invoice item or proration respectively. For subscriptions, the amount may be different from the plan’s regular price depending on whether the invoice covers a trial period or the invoice period differs from the plan’s usual interval.
   * The invoice object has both a subtotal and a total. The subtotal represents the total before any discounts, while the total is the final amount to be charged to the customer after all coupons have been applied.
   * The invoice also has a next_payment_attempt attribute that tells you the next time (as a Unix timestamp) payment for the invoice will be automatically attempted. For invoices with manual payment collection, that have been closed, or that have reached the maximum number of retries (specified in your subscriptions settings), the next_payment_attempt will be null.
   *
   * @see https://stripe.com/docs/api/invoices/retrieve?lang=node
   */
  static async getInvoice(
    invoiceId: string,
    params?: Stripe.InvoiceRetrieveParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.Invoice> {
    logger.info('StripeService.getInvoice', { invoiceId, params, options });

    let invoice: Stripe.Invoice;
    try {
      invoice = await this.Stripe.invoices.retrieve(invoiceId, params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }
    return invoice;
  }

  /**
   * Search for invoices you’ve previously created using Stripe’s Search Query Language. Don’t use search in read-after-write flows where strict consistency is necessary. Under normal operating conditions, data is searchable in less than a minute. Occasionally, propagation of new or updated data can be up to an hour behind during outages. Search functionality is not available to merchants in India.
   *
   * @param {JSON} query - The search query string. See search query language and the list of supported query fields for invoices.
   * @param {String} limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {String} page - A cursor for pagination across multiple pages of results. Don’t include this parameter on the first call. Use the next_page value returned in a previous response to request subsequent results.
   * @returns {Promise<JSON>} - A dictionary with a data property that contains an array of up to limit invoices. If no objects match the query, the resulting array will be empty. See the related guide on expanding properties in lists.
   *
   * @see https://stripe.com/docs/api/invoices/list?lang=node
   * @see https://stripe.com/docs/search#search-query-language
   */
  static async getInvoicesByQuery(
    params: Stripe.InvoiceSearchParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiSearchResult<Stripe.Invoice>> {
    logger.info('StripeService.getInvoicesByQuery', { params, options });

    let invoices: Stripe.ApiSearchResult<Stripe.Invoice>;

    try {
      invoices = await this.Stripe.invoices.search(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return invoices;
  }

  static async listInvoices(
    params: Stripe.InvoiceListParams,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    logger.info('StripeService.listInvoices', { params, options });

    let invoices: Stripe.ApiList<Stripe.Invoice>;

    try {
      invoices = await this.Stripe.invoices.list(params, options);
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return invoices;
  }

  /**
   * @todo Move to StripeHelper
   *
   * Returns a list of invoices for a customer.
   *
   * @param {String} customerId - The ID of the customer to retrieve the invoices for.
   * @returns {Promise<JSON>} - Returns a list of the customer's invoices. You can optionally request that the response include the total count of all invoices for the customer. To do so, specify include[]=total_count in your request.
   *
   * @see https://stripe.com/docs/api/invoices/list?lang=node
   */
  static async getCustomerInvoices(
    customerId: string,
    options?: Stripe.RequestOptions
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    logger.info('StripeService.getCustomerInvoices', { customerId, options });

    let invoices: Stripe.ApiList<Stripe.Invoice>;

    try {
      invoices = await this.Stripe.invoices.list(
        {
          customer: customerId,
        },
        options
      );
    } catch (error: any) {
      switch (error.type) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }
    return invoices;
  }
}
