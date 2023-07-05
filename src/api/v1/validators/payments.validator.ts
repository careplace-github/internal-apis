import { check, validationResult } from 'express-validator';
import { LayerError } from '@api/v1/utils';
import logger from 'src/logs/logger';

// -------------------------------------------------------------------------------------------- //
//                                       ADD EVENT VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

const Checkout_BillingDetailsValidation = check('billing_details').custom((value, { req }) => {
  const missingFields: string[] = [];

  /**
   * Check if billingDetails is missing
   */
  if (!value) {
    missingFields.push('billing_details');
  } else {
    /**
     * Check if the name is missing
     */
    if (!value.name) {
      missingFields.push('name');
    }

    /**
     * Check if the email is missing
     */
    if (!value.email) {
      missingFields.push('email');
    }
  }

  /**
   * Check if the address is missing
   */
  if (!value.address) {
    missingFields.push('address');
  } else {
    /**
     * Check if the street is missing
     */
    if (!value.address.street) {
      missingFields.push('address.street');
    }

    /**
     * Check if the postal_code is missing
     */
    if (!value.address.postal_code) {
      missingFields.push('address.postal_code');
    }

    /**
     * Check if the city is missing
     */
    if (!value.address.city) {
      missingFields.push('address.city');
    }

    /**
     * Check if the country is missing
     */
    if (!value.address.country) {
      missingFields.push('address.country');
    }
  }

  if (missingFields.length > 0) {
    // return false;
    throw new Error(`Missing required field(s): ${missingFields.join(', ')}`);
  }

  return true;
});

// Check if the field payment_method_id exists and is a string, message should be "invalid"
const Checkout_PaymentMethodValid = check('payment_method_id').custom((value, { req }) => {
  if (!value) {
    throw new Error('Missing required field: payment_method_id');
  }

  if (typeof value !== 'string') {
    throw new Error(`Field 'payment_method_id' must be a string.`);
  }

  return true;
});

export const CheckoutValidator = [Checkout_BillingDetailsValidation, Checkout_PaymentMethodValid];
