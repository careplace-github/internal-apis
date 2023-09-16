import express from 'express';

// Import Controller
import { AuthenticationGuard, ClientGuard, ValidatorMiddleware } from '@packages/middlewares';
import PaymentsController from '@api/v1/controllers/payments.controller';

const router = express.Router();

// Tokens
router
  .route('/payments/tokens/bank')
  .post(AuthenticationGuard, ClientGuard('admin'), PaymentsController.createBankAccountToken);


  router
  .route('/payments/accounts/:connectAccount')
  .get(AuthenticationGuard, ClientGuard('admin'), PaymentsController.retrieveConnectAccount)
  .delete(AuthenticationGuard, ClientGuard('admin'), PaymentsController.deleteConnectAccount);
export default router;
