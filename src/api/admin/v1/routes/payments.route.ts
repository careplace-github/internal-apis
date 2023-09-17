import express from 'express';

// Import Controller
import { AuthenticationGuard, ClientGuard, ValidatorMiddleware } from '@packages/middlewares';
import AdminPaymentsController from '@api/admin/v1/controllers/payments.controller';

const router = express.Router();

// Tokens
router
  .route('/payments/tokens/bank')
  .post(AuthenticationGuard, ClientGuard('admin'), AdminPaymentsController.createBankAccountToken);

router
  .route('/payments/accounts/health-units/:healthUnit')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminCreateHealthUnitAccount
  );

router
  .route('/payments/customers/health-units/:healthUnit')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminCreateHealthUnitCustomer
  );

router
  .route('/payments/accounts/:connectAccount')
  .get(AuthenticationGuard, ClientGuard('admin'), AdminPaymentsController.retrieveConnectAccount)
  .delete(AuthenticationGuard, ClientGuard('admin'), AdminPaymentsController.deleteConnectAccount);
export default router;
