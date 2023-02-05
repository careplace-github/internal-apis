import * as Types from "./types";

// -------------------------------------------------------------------------------------------- //
//                                      PAYMENT METHODS                                         //
//                                                                                              //
// @see https://stripe.com/docs/api/payment_methods?lang=node                                   //
// -------------------------------------------------------------------------------------------- //

/**
 * PaymentMethod objects represent your customer's payment instruments. You can use them with PaymentIntents to collect payments or save them to Customer objects to store instrument details for future payments.
 *
 * @see https://stripe.com/docs/api/payment_methods?lang=node
 * @see https://stripe.com/docs/payments/payment-methods
 * @see https://stripe.com/docs/payments/more-payment-scenarios
 */
interface PaymentMethod {
  type: Types.PaymentMethodType;
}

/**
 * Stripe Card Object
 *
 * @see https://stripe.com/docs/api/cards/object?lang=node
 */
interface Card {
  /**
   * Unique identifier for the object.
   *
   * @see https://stripe.com/docs/api/cards/object?lang=node#card_object-id
   */
  id: String;

  /**
   * Card brand. Can be American Express, Diners Club, Discover, JCB, MasterCard, UnionPay, Visa, or Unknown.
   */
  brand: Types.CardBrand;

  /**
   * Two-letter ISO code representing the country of the card. You could use this attribute to get a sense of the international breakdown of cards you’ve collected
   *
   * @see https://stripe.com/docs/api/cards/object?lang=node#card_object-country
   */
  country: String;

  /**
   * The customer that this card belongs to. This attribute will not be in the card object if the card belongs to an account or recipient instead.
   *
   * @see https://stripe.com/docs/api/cards/object?lang=node#card_object-customer
   */
  customer: Customer;

  /**
   * Two-digit number representing the card’s expiration month.
   *
   * @see https://stripe.com/docs/api/cards/object?lang=node#card_object-exp_month
   */
  exp_month: Number;

  /**
   * Four-digit number representing the card’s expiration year.
   *
   * @see https://stripe.com/docs/api/cards/object?lang=node#card_object-exp_year
   */
  exp_year: Number;

  /**
   * The last four digits of the card.
   *
   * @see https://stripe.com/docs/api/cards/object?lang=node#card_object-fingerprint
   */
  last4: String;
}

/**
 * Stripe SEPA Direct Debit Account Object
 *
 * @see https://stripe.com/docs/payments/sepa-debit
 */
interface SepaDebit {}

/**
 * Stripe Bank Account Object
 *
 * @see https://stripe.com/docs/api/bank_accounts/object?lang=node
 */
interface BanAccount {}

/**
 * Stripe Customer Object
 *
 * @see https://stripe.com/docs/api/customers/object?lang=node
 */
interface Customer {
  /**
   * Unique identifier for the object.
   *
   * @see https://stripe.com/docs/api/customers/object?lang=node#customer_object-id
   */
  id: String;

  /**
   * The customer’s address.
   *
   * @see https://stripe.com/docs/api/customers/object?lang=node#customer_object-address
   */
  address?: Types.Address;

  /**
   * An arbitrary string attached to the object. Often useful for displaying to users.
   *
   * @see https://stripe.com/docs/api/customers/object?lang=node#customer_object-description
   */
  description?: String;

  /**
   * The customer’s full name or business name.
   *
   * @see https://stripe.com/docs/api/customers/object?lang=node#customer_object-name
   */
  name: String;

  /**
   * The customer’s phone number.
   *
   * @see https://stripe.com/docs/api/customers/object?lang=node#customer_object-phone
   */
  phone: String;

  shipping: String;
}

export { PaymentMethod };
