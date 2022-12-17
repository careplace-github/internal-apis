import stripe from 'stripe';

import { STRIPE_secret_key, STRIPE_publishable_key } from '../config/constants';

const stripeClient = stripe(STRIPE_secret_key);

/**
 * @class Class to manage the Stripe API
 * @documentation https://stripe.com/docs/api
 */
 export default class Stripe {


/**
 * @method createIndividualAccount
 * @description Create a Stripe account for an individual
 * @param {Object} data - The data to create the account
 * @param {String} data.email - The email of the account
 * @param {String} data.first_name - The first name of the account
 * @param {String} data.last_name - The last name of the account
 * @param {String} data.phone - The phone number of the account
 * @param {String} data.address - The address of the account
 * @param {String} data.city - The city of the account
 * @param {String} data.zip - The zip code of the account
 * @param {String} data.country - The country of the account
 * @param {String} data.dob - The date of birth of the account
 * @param {String} data.ssn_last_4 - The last 4 digits of the SSN of the account
 * @param {String} data.tos_acceptance_ip - The IP address of the account
 * @param {String} data.tos_acceptance_date - The date of acceptance of the TOS of the account
 * @returns {Promise} - The promise of the Stripe API
 */
static async createIndividualAccount(data) {
return stripeClient.accounts.create({
    type: 'individual',
    country: data.country,
    email: data.email,
    business_type: 'individual',
    individual: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        address: {
            line1: data.address,
            city: data.city,
            postal_code: data.zip,
            country: data.country
        },
        dob: {
            day: data.dob.day,
            month: data.dob.month,
            year: data.dob.year
        },
        ssn_last_4: data.ssn_last_4
    },
    tos_acceptance: {
        ip: data.tos_acceptance_ip,
        date: data.tos_acceptance_date
    }
});
}

/**
 * @method createCompanyAccount
 * @description Create a Stripe account for a company
 * @param {Object} data - The data to create the account
 * @param {String} data.email - The email of the account
 * @param {String} data.business_name - The business name of the account
 * @param {String} data.phone - The phone number of the account
 * @param {String} data.address - The address of the account
 * @param {String} data.city - The city of the account
 * @param {String} data.zip - The zip code of the account
 * @param {String} data.country - The country of the account
 * @param {String} data.dob - The date of birth of the account
 * @param {String} data.ssn_last_4 - The last 4 digits of the SSN of the account
 * @param {String} data.tos_acceptance_ip - The IP address of the account
 * @param {String} data.tos_acceptance_date - The date of acceptance of the TOS of the account
 * @returns {Promise} - The promise of the Stripe API
 * @todo Add the business tax ID
 * @todo Add the business VAT ID
 * @todo Add the business registration number
 * @todo Add the business registration URL
 * @todo Add the business registration address
 * @todo Add the business registration city
 * @todo Add the business registration zip
 * @todo Add the business registration country
 * @todo Add the business registration state
 * @todo Add the business registration date
 */
static async createCompanyAccount(data) {
return stripeClient.accounts.create({
    type: 'custom',
    country: data.country,
    email: data.email,
    business_type: 'company',
    company: {
        name: data.business_name,
        phone: data.phone,
        address: {
            line1: data.address,
            city: data.city,
            postal_code: data.zip,
            country: data.country
        },
        // tax_id: data.business_tax_id,
        // vat_id: data.business_vat_id,
        // registration_number: data.business_registration_number,
        // registration_url: data.business_registration_url,
        // registration_address: data.business_registration_address,
        // registration_city: data.business_registration_city,
        // registration_zip: data.business_registration_zip,
        // registration_country: data.business_registration_country,
        // registration_state: data.business_registration_state,
        // registration_date: data.business_registration_date
    },
    tos_acceptance: {
        ip: data.tos_acceptance_ip,
        date: data.tos_acceptance_date
    }
});
}





/**
 * @method getAccount
 * @description Get a Stripe account
 * @param {String} id - The ID of the account
 * @returns {Promise} - The promise of the Stripe API
 */
static async getAccount(id) {
return stripeClient.accounts.retrieve(id);
}

/**
 * @method updateAccount
 * @description Update a Stripe account
 * @param {String} id - The ID of the account
 * @param {Object} data - The data to update the account
 * @returns {Promise} - The promise of the Stripe API
 */
static async updateAccount(id, data) {
return stripeClient.accounts.update(id, data);
}

/**
 * @method flagAccount
 * @description Flag a Stripe account for suspicious activity or fraud. This will suspend the account and prevent it from accepting new transactions. The account will be closed if the account is not updated within 30 days. 
 * @param {String} id - The ID of the account
 * @param {Object} data - The data to flag the account
 * @param {String} data.reason - The reason for the flag
 * @param {String} data.message - The message for the flag
 * @returns {Promise} - The promise of the Stripe API
 */
static async flagAccount(id, data) {
return stripeClient.accounts.reject(id, {
    reason: data.reason,
    message: data.message
});
}


/**
 * @method deleteAccount
 * @description Delete a Stripe account
 * @param {String} id - The ID of the account
 * @returns {Promise} - The promise of the Stripe API
 */
static async deleteAccount(id) {
return stripeClient.accounts.del(id);
}

/**
 *  @method createAccountLink
 * @description Create a Stripe account link
 * @param {String} id - The ID of the account
 * @param {Object} data - The data to create the account link
 * @param {String} data.refresh_url - The URL to redirect to after the account link is used
 * @param {String} data.return_url - The URL to redirect to after the account link is used
 * @param {String} data.type - The type of the account link
 * @returns {Promise} - The promise of the Stripe API
 */
static async createAccountLink(id, data) {
return stripeClient.accountLinks.create({
    account: id,
    refresh_url: data.refresh_url,
    return_url: data.return_url,
    type: data.type,
   collect: data.collect,
     default_for_currency: data.default_for_currency,
     failure_url: data.failure_url,
    success_url: data.success_url
});
}

/**
 * @method createAccountToken
 * @description Create a Stripe account token
 * @param {Object} data - The data to create the account token. The token is used to securely provide details to the account. 
 * @param {String} data.account_id - The ID of the account
 * @param {String} data.client_ip - The IP address of the client
 * @param {String} data.created - The date of creation of the token
 * @param {String} data.email - The email of the token
 * @param {String} data.livemode - The livemode of the token
 * @param {String} data.type - The type of the token
 * @param {String} data.used - The used status of the token
 * @returns {Promise} - The promise of the Stripe API
 */
static async createAccountToken(data) {
return stripeClient.tokens.create({
    account: {
        id: data.account_id,
        client_ip: data.client_ip,
        created: data.created,
        email: data.email,
        livemode: data.livemode,
        type: data.type,
        used: data.used
    }
});
}


/**
 * @method createBankAccountToken
 * @description Create a Stripe bank account token. The token is used to securely provide details to the bank account. 
 * @param {Object} data - The data to create the bank account token
 * @param {String} data.account_number - The account number of the bank account
 * @param {String} data.account_holder_name - The account holder name of the bank account
 * @param {String} data.account_holder_type - The account holder type of the bank account
 * @param {String} data.bank_name - The bank name of the bank account
 * @param {String} data.country - The country of the bank account
 * @param {String} data.currency - The currency of the bank account
 * @param {String} data.fingerprint - The fingerprint of the bank account
 * @param {String} data.last4 - The last 4 digits of the bank account
 * @param {String} data.routing_number - The routing number of the bank account
 * @param {String} data.status - The status of the bank account
 * @returns {Promise} - The promise of the Stripe API
 */
static async createBankAccountToken(data) {
return stripeClient.tokens.create({
    bank_account: {
        account_number: data.account_number,
        account_holder_name: data.account_holder_name,
        account_holder_type: data.account_holder_type,
        bank_name: data.bank_name,
        country: data.country,
        currency: data.currency,
        fingerprint: data.fingerprint,
        last4: data.last4,
        routing_number: data.routing_number,
        status: data.status
    }
});
}


/**
 * @method createCardToken
 * @description Create a Stripe card token. The token is used to securely provide details to the card. 
 * @param {Object} data - The data to create the card token
 * @param {String} data.address_city - The city of the card
 * @param {String} data.address_country - The country of the card
 * @param {String} data.address_line1 - The address line 1 of the card
 * @param {String} data.address_line2 - The address line 2 of the card
 * @param {String} data.address_state - The state of the card
 * @param {String} data.address_zip - The zip code of the card
 * @param {String} data.brand - The brand of the card
 * @param {String} data.country - The country of the card
 * @param {String} data.currency - The currency of the card
 * @param {String} data.cvc_check - The CVC check of the card
 * @param {String} data.exp_month - The expiration month of the card
 * @param {String} data.exp_year - The expiration year of the card
 * @param {String} data.fingerprint - The fingerprint of the card
 * @param {String} data.funding - The funding of the card
 * @param {String} data.last4 - The last 4 digits of the card
 * @param {String} data.name - The name of the card
 * @param {String} data.tokenization_method - The tokenization method of the card
 * @returns {Promise} - The promise of the Stripe API
*/
static async createCardToken(data) {

return stripeClient.tokens.create({
    card: {
        address_city: data.address_city,
        address_country: data.address_country,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        address_state: data.address_state,
        address_zip: data.address_zip,
        brand: data.brand,
        country: data.country,
        currency: data.currency,
        cvc_check: data.cvc_check,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        fingerprint: data.fingerprint,
        funding: data.funding,
        last4: data.last4,
        name: data.name,
        tokenization_method: data.tokenization_method
    }
})
}


/**
 * @method createPaymentIntent 
 * @description Create a Stripe payment intent. The payment intent is used to confirm the payment. 
 * @param {Object} data - The data to create the payment intent
 * @param {String} data.amount - The amount of the payment intent
 * @param {String} data.currency - The currency of the payment intent
 * @param {String} data.description - The description of the payment intent
 * @param {String} data.payment_method_types - The payment method types of the payment intent
 * @param {String} data.receipt_email - The receipt email of the payment intent
 * @param {String} data.statement_descriptor - The statement descriptor of the payment intent
 * @param {String} data.statement_descriptor_suffix - The statement descriptor suffix of the payment intent
 * @param {String} data.transfer_data - The transfer data of the payment intent
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/payment_intents/create
 */
static async createPaymentIntent(data) {
return stripeClient.paymentIntents.create({
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    payment_method_types: data.payment_method_types,
    receipt_email: data.receipt_email,
    statement_descriptor: data.statement_descriptor,
    statement_descriptor_suffix: data.statement_descriptor_suffix,
    transfer_data: data.transfer_data
});
}

/**
 * @method confirmPaymentIntent
 * @description Confirm a Stripe payment intent. The payment intent is used to confirm the payment.
 * @param {Object} data - The data to confirm the payment intent
 * @param {String} data.payment_intent_id - The payment intent id of the payment intent
 * @param {String} data.payment_method_id - The payment method id of the payment intent
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/payment_intents/confirm
*/
static async confirmPaymentIntent(data) {
return stripeClient.paymentIntents.confirm(data.payment_intent_id, {
    payment_method: data.payment_method_id
});

}


/**
 * @description Create subscription for a customer on Stripe.
 * @param {Object} data - The data to create the subscription
 * @param {String} data.customer_id - The customer id of the subscription
 * @param {String} data.plan_id - The plan id of the subscription
 * @param {String} data.quantity - The quantity of the subscription
 * @param {String} data.tax_percent - The tax percent of the subscription
 * @param {String} data.trial_end - The trial end of the subscription
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/subscriptions/create
 */
static async createSubscription(data) {

return stripeClient.subscriptions.create({
    customer: data.customer_id,
    items: [
        {
            plan: data.plan_id,
            quantity: data.quantity
        }
    ],
    tax_percent: data.tax_percent,
    trial_end: data.trial_end
});

}

/**
 * @description Create a Stripe customer. The customer is used to create a subscription.
 * @param {Object} data - The data to create the customer
 * @param {String} data.email - The email of the customer
 * @param {String} data.name - The name of the customer
 * @param {String} data.phone - The phone of the customer
 * @param {String} data.source - The source of the customer
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/customers/create
 */
static async createCustomer(data) {

return stripeClient.customers.create({

    email: data.email,
    name: data.name,
    phone: data.phone,
    source: data.source
});
}

/**
 * @description Create a Stripe plan. The plan is used to create a subscription.
 * @param {Object} data - The data to create the plan
 * @param {String} data.amount - The amount of the plan
 * @param {String} data.currency - The currency of the plan
 * @param {String} data.interval - The interval of the plan
 * @param {String} data.interval_count - The interval count of the plan
 * @param {String} data.nickname - The nickname of the plan
 * @param {String} data.product - The product of the plan
 * @param {String} data.trial_period_days - The trial period days of the plan
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/plans/create
 */
static async createPlan(data) {

return stripeClient.plans.create({
    amount: data.amount,
    currency: data.currency,
    interval: data.interval,
    interval_count: data.interval_count,
    nickname: data.nickname,
    product: data.product,
    trial_period_days: data.trial_period_days
});
}

/**
 * @description Create a Stripe coupon.
 * @param {Object} data - The data to create the coupon
 * @param {String} data.amount_off - The amount off of the coupon
 * @param {String} data.currency - The currency of the coupon
 * @param {String} data.duration - The duration of the coupon
 * @param {String} data.duration_in_months - The duration in months of the coupon
 * @param {String} data.max_redemptions - The max redemptions of the coupon
 * @param {String} data.percent_off - The percent off of the coupon
 * @param {String} data.redeem_by - The redeem by of the coupon
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/coupons/create
 * @see https://stripe.com/docs/api/coupons/object
 */
static async createCoupon(data) {

return stripeClient.coupons.create({
    amount_off: data.amount_off,
    currency: data.currency,
    duration: data.duration,
    duration_in_months: data.duration_in_months,
    max_redemptions: data.max_redemptions,
    percent_off: data.percent_off,
    redeem_by: data.redeem_by
});

}

/**
 * @description Creates a promotion code that represents a discount that can be applied to a customer.
 * @param {Object} data - The data to create the promotion code
 * @param {String} data.code - The code of the promotion code
 * @param {String} data.coupon - The coupon of the promotion code
 * @param {String} data.max_redemptions - The max redemptions of the promotion code
 * @param {String} data.redeem_by - The redeem by of the promotion code
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/promotion_codes/create
 * @see https://stripe.com/docs/api/promotion_codes/object
 */
static async createPromotionCode(data) {

return stripeClient.promotionCodes.create({
    code: data.code,
    coupon: data.coupon,
    max_redemptions: data.max_redemptions,
    redeem_by: data.redeem_by
});}

/**
 * @description Creates a discount that can be applied to a customer.
 * @param {Object} data - The data to create the discount
 * @param {String} data.coupon - The coupon of the discount
 * @param {String} data.customer - The customer of the discount
 * @param {String} data.duration - The duration of the discount
 * @param {String} data.end - The end of the discount
 * @param {String} data.promotion_code - The promotion code of the discount
 * @param {String} data.start - The start of the discount
 * @returns {Promise} - The promise of the Stripe API
 * @see https://stripe.com/docs/api/discounts/create
 * @see https://stripe.com/docs/api/discounts/object
 */
static async createDiscount(data) {

return stripeClient.discounts.create({
    coupon: data.coupon,
    customer: data.customer,
    duration: data.duration,
    end: data.end,
    promotion_code: data.promotion_code,
    start: data.start
});
}


 
}