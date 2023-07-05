// Import the express module
import express from 'express';

// Import Middlewares
import InputValidation from '../../middlewares/validators/inputValidation.middleware';

import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';

// Import Controller
import healthUnitsController from '../../controllers/health-units.controller';
import ServicesController from '../../controllers/services.controller';
import StripeController from '../../controllers/payments.controller';
import { bool } from 'aws-sdk/clients/signer';
import logger from 'src/logs/logger';

const router = express.Router();

router.route('/admin/payments/amounts').post((req, res) => {
  const { order_total, payment_method, currency_conversion, discount } = req.body;
  if (!order_total || order_total <= 0 || typeof order_total !== 'number' || !payment_method) {
    return res.status(400).json({ message: 'order_total is required' });
  }

  const amounts = calculateAmounts(order_total, payment_method, discount);
  res.status(200).json(amounts);
});

export default router;

// ------------------------------------------------------------

interface Amounts {
  order_total: number;
  discount_order_total: number | null;

  application_fee: number;
  stripe_processing_fees: {
    payments: {
      fixed_fee: number;
      percentage_fee: number;
      total_fee: number;
      total_fee_percentage: number;
    };
    total_fees: number;
    total_fees_percentage: number;
  };
  discount: Discount | null;
  connected_account_net: number;
  connected_account_earnings: number;
  connected_account_earnings_percentage: number;
  payment_method: {
    type: string;
    country: string;
  };
  careplace_net: number;
  careplace_earnings: number;
  careplace_earnings_percentage: number;
}

interface Discount {
  coupon: string;
  amount_off?: number;
  percent_off?: number;
}

function calculateAmounts(
  orderTotal: number,
  paymentMethod: {
    type: string;
    country: string;
  },
  discount?: Discount
): Amounts | { error: { message: string; discount: Discount } } {
  console.log(
    `calculateAmounts: orderTotal: ${orderTotal}, paymentMethod: ${paymentMethod}, discount: ${JSON.stringify(
      discount,
      null,
      2
    )}`
  );

  if (paymentMethod.type !== 'card') {
    throw new Error('Payment method currently not supported.');
  }

  /**
   * Stripe has different fees for EU and non-EU cards.
   *
   * Right now we only support card from Portugal (PT) to avoid currency conversion fees.
   *
   */
  if (paymentMethod.country !== 'PT') {
    throw new Error('Card country currently not supported.');
  }

  const BASE_APPLICATION_FEE = 15.0; // 15% base application fee
  const MIN_CAREPLACE_EARNINGS_PERCENTAGE = 5.0; // 5% minimum careplace earnings percentage

  let processingFeesPercentage = 0;

  /**
   * EU Fees:
   * fixed fee: 0.25€
   * percentage fee: 1.5
   *
   * Premium EU Fees:
   * fixed fee: 0.25€
   * percentage fee: 1.9
   *
   * There's no way to know if a card is EU or Premium EU.
   * Because of THAT we'll assume Premium EU fees for all EU cards.
   *
   * @see https://stripe.com/en-pt/pricing
   */
  const stripePercentageFee: number = 1.9; // 1.5% processing fee
  const stripeFixedFee: number = 0.25; // 0.25€ fixed fee

  processingFeesPercentage = stripePercentageFee;

  let applicationFee = BASE_APPLICATION_FEE;

  let stripeProcessingFees = orderTotal * (processingFeesPercentage / 100) + stripeFixedFee;

  let stripeTotalFeePercentage = Number(((stripePercentageFee / orderTotal) * 100).toFixed(2));

  let connectedAccountPercentage = 100 - applicationFee;
  let connectedAccountNet = orderTotal * (connectedAccountPercentage / 100);
  let connectedAccountEarnings = connectedAccountNet;
  let connectedAccountEarningsPercentage = Number(
    ((connectedAccountEarnings / orderTotal) * 100).toFixed(2)
  );

  let careplaceNet = Number(((orderTotal * applicationFee) / 100).toFixed(2));
  let careplaceEarnings = Number((careplaceNet - processingFeesPercentage).toFixed(2));
  let careplaceEarningsPercentage = Number(((careplaceEarnings / orderTotal) * 100).toFixed(2));

  let newApplicationFee = applicationFee;

  let discountOrderTotal = 0;

  if (discount && discount?.amount_off) {
    discountOrderTotal = orderTotal - discount.amount_off;

    const healthUnitPercentage = Number(
      (
        ((orderTotal * ((100 - applicationFee) / 100)) / (orderTotal - discount.amount_off)) *
        100
      ).toFixed(2)
    );
    console.log('NEW APPLICATION FEE: ' + applicationFee);


    stripeProcessingFees = Number(
      (discountOrderTotal * (stripePercentageFee / 100) + stripeFixedFee).toFixed(2)
    );

    stripeTotalFeePercentage = Number(
      ((stripeProcessingFees / discountOrderTotal) * 100).toFixed(2)
    );

    newApplicationFee = Number((100 - healthUnitPercentage).toFixed(2));

    careplaceEarningsPercentage = Number((newApplicationFee - stripeTotalFeePercentage).toFixed(2));

    careplaceNet = Number((discountOrderTotal * (newApplicationFee / 100)).toFixed(2));

    careplaceEarnings = Number(
      (discountOrderTotal * (careplaceEarningsPercentage / 100)).toFixed(2)
    );

    applicationFee = newApplicationFee;

    console.log('NEW APPLICATION FEE: ' + applicationFee);

    if (careplaceEarningsPercentage < MIN_CAREPLACE_EARNINGS_PERCENTAGE || healthUnitPercentage <= 0) {
      /**
       * Change the application fee to reflect the discount for the client and still maintain the 85% minimum earnings for the connected account
       * It should take into account the stripe processing fees
       */

      const application_fee = MIN_CAREPLACE_EARNINGS_PERCENTAGE + stripeTotalFeePercentage;

      const amount_off = discount.amount_off;

      console.log('NEW APPLICATION FEE: ' + application_fee);

      const min_order_total = Number(
        (
          (amount_off - amount_off * (application_fee / 100)) /
          ((BASE_APPLICATION_FEE - application_fee) / 100)
        ).toFixed(2)
      );

      logger.info('x: ' + min_order_total);

      return {
        error: {
          message: `Can't apply coupon. The order must be a minimum of ${min_order_total} €.`,
          discount: discount || null,
        },
      };
    }
  }

  return {
    order_total: orderTotal,
    discount_order_total: discountOrderTotal || null,
    application_fee: applicationFee,
    payment_method: paymentMethod,
    stripe_processing_fees: {
      payments: {
        fixed_fee: stripeFixedFee,
        percentage_fee: stripePercentageFee,
        total_fee: stripeProcessingFees,
        total_fee_percentage: stripeTotalFeePercentage,
      },
      total_fees: stripeProcessingFees,
      total_fees_percentage: stripeTotalFeePercentage,
    },

    discount: discount || null,

    connected_account_net: connectedAccountNet,
    connected_account_earnings: connectedAccountEarnings,
    connected_account_earnings_percentage: connectedAccountEarningsPercentage,

    careplace_net: careplaceNet,
    careplace_earnings: careplaceEarnings,
    careplace_earnings_percentage: careplaceEarningsPercentage,
  };
}

// ------------------------------------------------------------
