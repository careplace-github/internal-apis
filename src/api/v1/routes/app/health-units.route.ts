// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import healthUnitsController from '../../controllers/health-units.controller';
import OrdersController from '../../controllers/orders.controller';
import collaboratorsController from '../../controllers/collaborators.controller';
import StripeController from '../../controllers/payments.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

/**
 * Health Units Routes
 *
 * - Agency / Empresa SAD
 * - Retirement Homes / Lares de Idosos
 * - Senior Residences / Residências Sénior
 */

const router = express.Router();
router.route('/health-units/agencies/search').get(healthUnitsController.searchHealthUnits);
router.route('/health-units/agencies/:id').get(healthUnitsController.retrieve);

router
  .route('/health-units/agencies/dashboard')
  .get(AuthenticationGuard, AccessGuard('business'), healthUnitsController.getDashboard);

export default router;
