import { Timestamp } from "bson";
import stripe from "stripe";

import {
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY,
} from "../../../config/constants/index.js";

import logger from "../../../logs/logger.js";

/**
 * Class to manage the Stripe API
 *
 * @documentation https://stripe.com/docs/api
 */
export default class Stripe {
  constructor() {
    const stripeClient = stripe(STRIPE_SECRET_KEY);
    this.stripeClient = stripeClient;
  }

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
  async listPaymentMethods(customerId, type = null) {
    let paymentMethods;

    if (type !== null && type !== undefined) {
      paymentMethods = await this.stripeClient.customers.listPaymentMethods(
        customerId,

        { type: type }
      );
    } else {
      paymentMethods = await this.stripeClient.customers.listPaymentMethods(
        customerId
      );
    }

    return paymentMethods.data;
  }

  /**
   * Creates a PaymentMethod object.
   *
   * @param {StripeElements.PaymentMethod} type - The type of the PaymentMethod. An additional hash is included on the PaymentMethod with a name matching this value. It contains additional information specific to the PaymentMethod type. Required unless payment_method is specified (see the Cloning PaymentMethods guide).
   * @param {PaymentMethod} paymentMethod - The PaymentMethod to create
   * @returns {Promise<JSON>} - Returns a PaymentMethod object.
   *
   * @see https://stripe.com/docs/api/payment_methods/create?lang=node
   */
  async createPaymentMethod(type, paymentMethod, billingAddress) {
    let payload = {
      type: type,
      [paymentMethod]: paymentMethod,
      billing_details: {
        name: billingAddress.name,
        email: billingAddress.email,
        address: {
          line1: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postal_code,
          country: billingAddress.country,
        },
      },
    };

    payload.type = type;
    payload[paymentMethod] = paymentMethod;

    let createdPaymentMethod = await this.stripeClient.paymentMethods.create(
      payload
    );

    return createdPaymentMethod;
  }

  async getPaymentMethod(paymentMethodId) {
    let paymentMethod = await this.stripeClient.paymentMethods.retrieve(
      paymentMethodId
    );

    return paymentMethod;
  }

  async;

  async createPaymentMethodWithToken(type, token, billingAddress = {}) {
    let payload = {
      type: type,
      card: { token: token },

      billing_details: {
        name: billingAddress.name,
        email: billingAddress.email,
        address: {
          line1: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postal_code,
          country: billingAddress.country,
        },
      },
    };

    let createdPaymentMethod = await this.stripeClient.paymentMethods.create(
      payload
    );

    return createdPaymentMethod;
  }

  /**
   * Returns the subscriptions for a given connected account.
   *
   * @see https://stripe.com/docs/api/subscriptions/list?lang=node
   */
  async listSubscriptions(filters = {}) {
    let subscriptions;

    subscriptions = await this.stripeClient.subscriptions.list(filters);

    return subscriptions.data;
  }

  /**
   * @see https://stripe.com/docs/api/invoices/list?lang=node
   */
  async listInvoices(filters = {}) {
    let invoices;

    invoices = await this.stripeClient.invoices.list(filters);

    return invoices.data;
  }

  async listCharges(filters = {}) {
    let charges;

    charges = await this.stripeClient.charges.list(filters);

    return charges.data;
  }

  /**
   * Attaches a PaymentMethod object to a Customer.
   *
   * @param {String} paymentMethodId - The ID of the PaymentMethod to attach to the Customer.
   * @param {String} customerId - The ID of the Customer to attach the PaymentMethod to.
   * @returns {Promise<JSON>} - Returns a PaymentMethod object.
   *
   * @see https://stripe.com/docs/api/payment_methods/attach?lang=node
   */
  async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
    logger.info(
      `Stripe Service ATTACH_PAYMENT_METHOD_TO_CUSTOMER Request: ${JSON.stringify(
        paymentMethodId,
        null,
        2
      )} ${customerId}`
    );

    let attachedPaymentMethod = await this.stripeClient.paymentMethods.attach(
      paymentMethodId,
      { customer: customerId }
    );

    return attachedPaymentMethod;
  }

  async deletePaymentMethod(paymentMethodId) {
    logger.info(
      `Stripe Service DELETE_PAYMENT_METHOD Request: ${JSON.stringify(
        paymentMethodId,
        null,
        2
      )}`
    );

    let deletedPaymentMethod = await this.stripeClient.paymentMethods.detach(
      paymentMethodId
    );

    return deletedPaymentMethod;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                          PRODUCTS                                            //
  //                                                                                              //
  // @see https://stripe.com/docs/api/products?lang=node                                          //
  // -------------------------------------------------------------------------------------------- //

  /**
   * Creates a new price for an existing product. The price can be recurring or one-time.
   *
   * @param {String} productId - The ID of the product that this price will belong to.
   * @param {Number} price - The unit amount in cents to be charged, represented as a whole integer if possible. If you want to charge $10.50, pass 1050. This will be represented as $10.50 when on the API and the Stripe Dashboard. This field is required.
   * @param {String} currency - Three-letter ISO currency code, in lowercase. Must be a supported currency. Required.
   * @param {String} recurrency - Specifies billing frequency. Either day, week, month or year. Required.
   * @returns {Promise<JSON>} - Returns a Price object if the call succeeded. Throws an error if a problem occurs.
   *
   * @see https://stripe.com/docs/api/prices/create?lang=node
   */
  async createPrice(productId, price, currency, recurrency) {
    console.log("createPrice ", productId, price, currency, recurrency);

    let createdPrice = await this.stripeClient.prices.create({
      product: productId,
      unit_amount: price,
      currency: currency,
      recurring: {
        interval: recurrency,
      },

      tax_behavior: "inclusive",
    });

    return createdPrice;
  }

  async getCoupon(couponId, filters = {}) {
    let coupon = await this.stripeClient.coupons.retrieve(couponId, filters);

    return coupon;
  }

  async listCoupons(filters = {}) {
    let coupons;

    coupons = await this.stripeClient.coupons.list(filters);

    return coupons.data;
  }

  async getPromotionCode(promotionCodeId, filter = {}) {
    return this.stripeClient.promotionCodes.retrieve(promotionCodeId, filter);
  }

  async listPromotionCodes(filters = {}) {
    let promotionCodes;

    promotionCodes = await this.stripeClient.promotionCodes.list(filters);

    return promotionCodes.data;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                        PAYMENT INTENTS                                       //
  //                                                                                              //
  // @see https://stripe.com/docs/api/payment_intents?lang=node                                   //
  // -------------------------------------------------------------------------------------------- //

  // -------------------------------------------------------------------------------------------- //
  //                                           CONNECT                                            //
  //                                                                                              //
  // @see https://stripe.com/docs/api/accounts?lang=node                                          //
  // -------------------------------------------------------------------------------------------- //

  /**
   * Creates a Stripe account.
   *
   * @param {String} type - The type of account to create. Can be "standard", "express", or "custom".
   * @returns {Promise<JSON>} - Returns an Account object if the call succeeds.
   *
   * @see https://stripe.com/docs/api/accounts/create?lang=node
   */
  async createAccount(type) {
    const account = await this.stripeClient.accounts.create({
      type: type,
    });

    return account;
  }

  /**
   * Creates a Stripe account link.
   *
   * @param {String} accountId - The ID of the account to create the link for.
   * @param {String} type - The type of account link to create. Can be "account_onboarding" or "account_update".
   * @param {String} refresh_url - The URL you provide to redirect a user to if their session expires while on the Stripe site.
   * @param {String} return_url - The URL you provide to redirect a user back to your website after they have successfully completed the link flow on the Stripe site.
   * @returns {Promise<JSON>} - Returns an account link object if the call succeeded.
   *
   * @see https://stripe.com/docs/api/account_links/create?lang=node
   */
  async createAccountLink(accountId, type, refresh_url, return_url) {
    const accountLink = await this.stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url,
      return_url: return_url,
      type: type,
    });

    return accountLink;
  }

  /**
   * Retrieves the details of an account.
   *
   * @param {String} accountId
   * @returns {Promise<JSON>} - Returns an Account object if the call succeeds. If the account ID does not exist, this call throws an error.
   *
   * @see https://stripe.com/docs/api/accounts/retrieve?lang=node
   */
  async getAccount(accountId) {
    const account = await this.stripeClient.accounts.retrieve(accountId);

    return account;
  }

  /**
   * You can see a list of the bank accounts that belong to a connected account. Note that the 10 most recent external accounts are always available by default on the corresponding Stripe object. If you need more than those 10, you can use this API method and the limit and starting_after parameters to page through additional bank accounts.
   *
   * @param {String} accountId - The ID of the account to list the bank accounts for.
   * @returns {Promise<JSON>} - Returns a list of the bank accounts stored on the account.
   *
   * @see https://stripe.com/docs/api/external_account_bank_accounts/list?lang=node
   */
  async listExternalAccounts(accountId) {
    const bankAccounts = await this.stripeClient.accounts.listExternalAccounts(
      accountId,
      {
        object: "bank_account",
      }
    );

    return bankAccounts;
  }

  async createExternalAccount(accountId, token) {
    logger.info(
      `Stripe Service CREATE_EXTERNAL_ACCOUNT Request: ${accountId} ${token}`
    );

    const bankAccount = await this.stripeClient.accounts.createExternalAccount(
      accountId,
      {
        external_account: token,
      }
    );

    return bankAccount;
  }

  async getExternalAccount(accountId, bankAccountId) {
    const bankAccount =
      await this.stripeClient.accounts.retrieveExternalAccount(
        accountId,
        bankAccountId
      );

    return bankAccount;
  }

  async deleteExternalAccount(accountId, bankAccountId) {
    const bankAccount = await this.stripeClient.accounts.deleteExternalAccount(
      accountId,
      bankAccountId
    );

    return bankAccount;
  }

  /**
   * You can see a list of the cards that belong to a connected account. The 10 most recent external accounts are available on the account object. If you need more than 10, you can use this API method and the limit and starting_after parameters to page through additional cards.
   *
   * @param {String} accountId - The ID of the account to list the bank accounts for.
   * @returns {Promise<JSON>} - Returns a list of the cards stored on the account.
   *
   * @see https://stripe.com/docs/api/external_account_bank_accounts/list?lang=node
   */
  async listConnectedAccountExternalAccountsOfCards(accountId, bankAccountId) {
    const bankAccounts = await this.stripeClient.accounts.listExternalAccounts(
      accountId,
      {
        object: "card",
      }
    );

    return bankAccounts;
  }

  /**
   * Retrieves the details of an external account that is attached to a Stripe account.
   *
   * @param {String} accountId - The ID of the account to retrieve the external account for.
   * @param {String} externalAccountId - The ID of the external account to retrieve.
   * @returns Returns the external account object.
   *
   * @see https://stripe.com/docs/api/external_account_cards/retrieve?lang=node
   * @see https://stripe.com/docs/api/external_account_bank_accounts/retrieve?lang=node
   */
  getConnectedAccountExternalAccountDetails(accountId, externalAccountId) {
    return this.stripeClient.accounts.retrieveExternalAccount(
      accountId,
      externalAccountId
    );
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
  async createCustomer(customer) {
    let createdCustomer = await this.stripeClient.customers.create(customer);

    return createdCustomer;
  }

  /**
   * Returns a list of your customers. The customers are returned sorted by creation date, with the most recent customers appearing first.
   *
   * @returns {Promise<JSON>} - A object with a data property that contains an array of up to limit customers, starting after customer starting_after. Passing an optional email will result in filtering to customers with only that exact email address. Each entry in the array is a separate customer object. If no more customers are available, the resulting array will be empty. This request should never throw an error.
   *
   * @see https://stripe.com/docs/api/customers/list?lang=node
   */
  async listCustomers() {
    let customers = await this.stripeClient.customers.list();

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
  async getCustomer(customerId) {
    let customer = await this.stripeClient.customers.retrieve(customerId);

    return customer;
  }

  async createCustomerTaxId(customerId, taxId) {
    // Add "PT" to the tax id
    taxId = "PT" + taxId;

    let customerTaxId = await this.stripeClient.customers.createTaxId(
      customerId,
      {
        type: "eu_vat",
        value: taxId,
      }
    );

    return customerTaxId;
  }

  /**
   * Creates a single-use token that represents a bank account’s details. This token can be used with any API method in place of a bank account object. This token can be used only once, by attaching it to a Custom account.
   *
   * @param {JSON} bankAccount - The bank account this token will represent.
   * @returns {Promise<JSON>} - Returns the created bank account token if successful. Otherwise, this call throws an error.
   *
   * @see https://stripe.com/docs/api/tokens/create_bank_account?lang=node
   */
  async createBankAccountToken(bankAccount) {
    let bankAccountToken = await this.stripeClient.tokens.create({
      bank_account: {
        account_holder_name: bankAccount.account_holder_name || null,
        account_holder_type: bankAccount.account_holder_type || null,
        country: bankAccount.country || null,
        currency: bankAccount.currency || null,
        routing_number: bankAccount.routing_number || null,
        account_number: bankAccount.account_number || null,

        // Optional
        account_holder_type: bankAccount.account_holder_type || null,
        default_for_currency: bankAccount.default_for_currency || null,
        metadata: bankAccount.metadata || null,
      },
    });

    return bankAccountToken;
  }

  /**
   * Creates a single-use token that represents a credit card’s details. This token can be used in place of a credit card object with any API method. These tokens can be used only once: by creating a new Charge object, or by attaching them to a Customer object.
   *
   * @param {Card} card - The card this token will represent. If you also pass in a customer, the card must be the ID of a card belonging to the customer. Otherwise, if you do not pass in a customer, this is an object containing a user's credit card details, with the options described below.
   * @returns {Promise<JSON>} - Returns the created card token if successful. Otherwise, this call throws an error.
   */
  async createCardToken(card) {
    let cardToken = await this.stripeClient.tokens.create({
      card: card,
    });

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
  async retrieveToken(tokenId) {
    let token = await this.stripeClient.tokens.retrieve(tokenId);

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
  async getCharge(chargeId) {
    let charge = await this.stripeClient.charges.retrieve(chargeId);

    return charge;
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
  async getChargesByQuery(query, limit, page) {
    let charges = await this.stripeClient.charges.list({
      query: query,
      limit: limit,
      starting_after: page,
    });

    return charges;
  }

  /**
   * Retrieves the details of an event. Supply the unique identifier of the event, which you might have received in a webhook.
   *
   * @param {*} eventId - The identifier of the event to be retrieved.
   * @returns {Promise<JSON>} - Returns an event object if a valid identifier was provided. All events share a common structure, detailed to the right. The only property that will differ is the data property.
   * In each case, the data object will have an attribute called object and its value will be the same as retrieving the same object directly from the API. For example, a customer.created event will have the same information as retrieving the relevant customer would.
   * In cases where the attributes of an object have changed, data will also contain a object containing the changes.
   *
   * @see https://stripe.com/docs/api/events/retrieve?lang=node
   */
  async getEvent(eventId) {
    let event = await this.stripeClient.events.retrieve(eventId);

    return event;
  }

  /**
   * List events, going back up to 30 days. Each event data is rendered according to Stripe API version at its creation time, specified in event object api_version attribute (not according to your current Stripe API version or Stripe-Version header).
   *
   * @param {Timestamp} created - A filter on the list based on the object created field. The value can be a string with an integer Unix timestamp, or it can be a dictionary with the following options:
   * @param {String} deliverySuccess - Filter events by whether all webhooks were successfully delivered. If false, events which are still pending or have failed all delivery attempts to a webhook endpoint will be returned.
   * @param {Number} endingBefore - A cursor for use in pagination. ending_before is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with obj_bar, your subsequent call can include ending_before=obj_bar in order to fetch the previous page of the list.
   * @param {Number} limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {Number} startingAfter - A cursor for use in pagination. starting_after is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include starting_after=obj_foo in order to fetch the next page of the list.
   * @param {String} type - A string containing a specific event name, or group of events using * as a wildcard. The list will be filtered to include only events with a matching event property.
   * @returns {Promise<JSON>} -A object with a data property that contains an array of up to limit events, starting after event starting_after. Each entry in the array is a separate event object. If no more events are available, the resulting array will be empty. This request should never throw an error.
   *
   * @see https://stripe.com/docs/api/events/list?lang=node
   */
  async listEvents(
    created,
    deliverySuccess,
    endingBefore,
    limit,
    startingAfter,
    type
  ) {
    let events = await this.stripeClient.events.list({
      created: created,
      delivery_success: deliverySuccess,
      ending_before: endingBefore,
      limit: limit,
      starting_after: startingAfter,
      type: type,
    });

    return events;
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
  async constructEvent(event, signature, endpointSecret) {
    let stripeEvent = await this.stripeClient.webhooks.constructEvent(
      event,
      signature,
      endpointSecret
    );

    logger.info(`Stripe Event: ${JSON.stringify(stripeEvent, null, 2)}`);

    return stripeEvent;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                          BIILING                                             //
  //                                                                                              //
  // @see https://stripe.com/docs/api/subscriptions?lang=node                                     //
  // -------------------------------------------------------------------------------------------- //

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
  async createSubscription(
    customerId,
    priceId,
    transferAccount,
    applicationFee,
    paymentMethod,
    promotionCode
  ) {
    logger.info("AQUI DENTRO PROMO: " + promotionCode);

    let subscription = await this.stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
      transfer_data: {
        destination: transferAccount,
      },
      application_fee_percent: applicationFee,
      default_payment_method: paymentMethod,

      automatic_tax: {
        enabled: true,
      },

      //coupon: coupon,
      promotion_code: promotionCode,

      collection_method: "charge_automatically",
    });

    return subscription;
  }

  async updateSubscription(subscriptionId, options) {
    let subscription = await this.stripeClient.subscriptions.update(
      subscriptionId,
      options
    );

    return subscription;
  }

  async getCustomerTaxIds(customerId) {
    let taxId = await this.stripeClient.customers.listTaxIds(customerId);

    return taxId;
  }

  async sendInvoice(invoiceId) {
    let invoice = await this.stripeClient.invoices.sendInvoice(invoiceId);

    return invoice;
  }

  async getInvoice(invoiceId) {
    let invoice = await this.stripeClient.invoices.retrieve(invoiceId);

    return invoice;
  }

  async getCharge(chargeId) {
    let charge = await this.stripeClient.charges.retrieve(chargeId);

    return charge;
  }

  /**
   * Retrieves the subscription with the given ID.
   *
   * @param {String} subscriptionId - The ID of the subscription to retrieve.
   * @returns {Promise<JSON>} - Returns the subscription object.
   *
   * @see https://stripe.com/docs/api/subscriptions/retrieve?lang=node
   */
  async getSubscription(subscriptionId) {
    let subscription = await this.stripeClient.subscriptions.retrieve(
      subscriptionId
    );

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
  async getSubscriptionsByQuery(query, limit, page) {
    let subscriptions = await this.stripeClient.subscriptions.search(
      query,
      limit,
      page
    );

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
  async getCustomerSubscriptions(customerId) {
    let subscriptions = await this.stripeClient.subscriptions.list({
      customer: customerId,
    });
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
  async getInvoice(invoiceId) {
    let invoice = await this.stripeClient.invoices.retrieve(invoiceId);
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
  async getInvoicesByQuery(query, limit, page) {
    let invoices = await this.stripeClient.invoices.search(query, limit, page);

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
  async getCustomerInvoices(customerId) {
    let invoices = await this.stripeClient.invoices.list({
      customer: customerId,
    });
    return invoices;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                          WEB HOOKS                                           //
  //                                                                                              //
  // @see https://stripe.com/docs/api/payment_methods?lang=node                                   //
  // -------------------------------------------------------------------------------------------- //

  /**
   * A webhook endpoint must have a url and a list of enabled_events. You may optionally specify the Boolean connect parameter. If set to true, then a Connect webhook endpoint that notifies the specified url about events from all connected accounts is created; otherwise an account webhook endpoint that notifies the specified url only about events from your account is created. You can also create webhook endpoints in the webhooks settings section of the Dashboard.
   *
   * @param {String} url - The URL of the webhook endpoint.
   * @param {Array<String>} events - The list of events to enable for this endpoint. You may specify [’*’] to enable all events, except those that require explicit selection.
   * @param {String} description - An optional description for the webhook endpoint. If not provided, the description will be set to the URL.
   * @param {Boolean} connect - Whether this endpoint should receive events from connected accounts (true), or from your account (false). Defaults to false.
   * @returns {Promise<JSON>} Returns the webhook endpoint object with the secret field populated.
   *
   * @see https://stripe.com/docs/api/webhook_endpoints/create?lang=node
   */
  async createWebhookEndpoint(url, events, description, connect) {
    let webhookEndpoint = await this.stripeClient.webhookEndpoints.create({
      url: url,
      enabled_events: events,
      description: description,
      connect: connect != null ? connect : false,
    });
    return webhookEndpoint;
  }

  /**
   * Retrieves the webhook endpoint with the given ID
   *
   * @param {String} webhookId
   * @returns {Promise<JSON>} Returns a webhook endpoint if a valid webhook endpoint ID was provided. Throws an error otherwise.
   *
   * @see https://stripe.com/docs/api/webhook_endpoints/retrieve?lang=node
   */
  async getWebhookEndpoint(webhookId) {
    let webhookEndpoint = await this.stripeClient.webhookEndpoints.retrieve(
      webhookId
    );
    return webhookEndpoint;
  }

  /**
   * Updates the webhook endpoint. You may edit the url, the list of enabled_events, and the status of your endpoint.
   *
   * @param {String} url - The URL of the webhook endpoint.
   * @param {Array<String>} events - The list of events to enable for this endpoint. You may specify [’*’] to enable all events, except those that require explicit selection.
   * @param {String} description - An optional description for the webhook endpoint. If not provided, the description will be set to the URL.
   * @param {Boolean} connect - Whether this endpoint should receive events from connected accounts (true), or from your account (false). Defaults to false.
   * @returns {Promise<JSON>} The updated webhook endpoint object if successful. Otherwise, this call throws an error.
   *
   * @see https://stripe.com/docs/api/webhook_endpoints/update?lang=node
   */
  async updateWebhookEndpoint(url, events, description, connect) {
    let webhookEndpoint = await this.stripeClient.webhookEndpoints.update({
      url: url,
      enabled_events: events,
      description: description,
      connect: connect != null ? connect : false,
    });
    return webhookEndpoint;
  }

  /**
   * Deletes the webhook endpoint with the given ID. You can also delete webhook endpoints via the webhook endpoint management page of the Stripe dashboard.
   *
   * @param {String} webhookId - The ID of the webhook endpoint to be deleted.
   * @returns {Promise<JSON>} An object with the deleted webhook endpoints’s ID. Otherwise, this call throws an error, such as if the webhook endpoint has already been deleted.
   *
   * @see https://stripe.com/docs/api/webhook_endpoints/delete?lang=node
   */
  async deleteWebhookEndpoint(webhookId) {
    let webhookEndpoint = await this.stripeClient.webhookEndpoints.delete(
      webhookId
    );
    return webhookEndpoint;
  }

  /**
   * Returns a list of your webhook endpoints.
   *
   * @param {Number} endingBefore - A cursor for use in pagination. ending_before is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with obj_bar, your subsequent call can include ending_before=obj_bar in order to fetch the previous page of the list.
   * @param {Number} limit - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {Number} startinAfter - A cursor for use in pagination. starting_after is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include starting_after=obj_foo in order to fetch the next page of the list.
   * @returns {Promise<JSON>} A object with a data property that contains an array of up to limit webhook endpoints, starting after webhook endpoint starting_after. Each entry in the array is a separate webhook endpoint object. If no more webhook endpoints are available, the resulting array will be empty. This request should never throw an error.
   *
   * @see https://stripe.com/docs/api/webhook_endpoints/list?lang=node
   */
  async listWebhookEndpoints(endingBefore, limit, startinAfter) {
    let webhookEndpoints = await this.stripeClient.webhookEndpoints.list({
      ending_before: endingBefore,
      limit: limit,
      starting_after: startinAfter,
    });
    return webhookEndpoints;
  }
}
