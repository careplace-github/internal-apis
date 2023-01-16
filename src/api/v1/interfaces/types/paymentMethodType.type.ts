import {StripeElements} from "../index.js";


/**
 * PaymentMethod objects represent your customer's payment instruments. You can use them with PaymentIntents to collect payments or save them to Customer objects to store instrument details for future payments.
 * 
 * @see https://stripe.com/docs/api/payment_methods/create?lang=node#create_payment_method-type
 * 
 * @see https://stripe.com/docs/api/payment_methods?lang=node
 * @see https://stripe.com/docs/payments/payment-methods
 * @see https://stripe.com/docs/payments/more-payment-scenarios
 */
export type PaymentMethodType = {
    /**
     * @param {StripeElements.Card}
     */
    card: StripeElements.Card;
    /**
     * @param {StripeElements.BankAccount}
     */
    us_bank_account: StripeElements.BankAccount;

    /**
     * @param {StripeElements.SepaDebit}
     */
    sepa_debit: StripeElements.SepaDebit;
};

