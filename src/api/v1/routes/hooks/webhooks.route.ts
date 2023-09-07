// Import the express module
import express from 'express';

// Import Controller
import StripeWebhooksController from '../../controllers/hooks/stripe-webhooks.controller';

const router = express.Router();

router
  .route('/webhooks/stripe')
  .post(express.raw({ type: 'application/json' }), StripeWebhooksController.connect);

export default router;
