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
  .route('/payments/health-units/:healthUnit/external-accounts/default')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminSetHealthUnitExternalAccountAsDefault
  );

router
  .route('/payments/health-units/:healthUnit/external-accounts')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminCreateHealthUnitExternalAccount
  )
  .get(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminListHealthUnitExternalAccounts
  );

router
  .route('/payments/accounts')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminCreateHealthUnitAccount
  );

router
  .route('/payments/customers')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminCreateHealthUnitCustomer
  );

router
  .route('/payments/accounts/:connectAccount')
  .get(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminRetrieveHealthUnitConnectAccount
  )
  .delete(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminDeleteHealthUnitConnectAccount
  );

router
  .route('/payments/customers/:customer')
  .get(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminRetrieveHealthUnitCustomerId
  )
  .delete(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminPaymentsController.adminDeleteHealthUnitCustomerId
  );

export default router;
