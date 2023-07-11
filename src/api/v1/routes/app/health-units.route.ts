// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import healthUnitsController from '../../controllers/health-units.controller';
import OrdersController from '../../controllers/orders.controller';
import collaboratorsController from '../../controllers/collaborators.controller';
import StripeController from '../../controllers/payments.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import ClientGuard from '../../middlewares/guards/clientGuard.middleware';

/**
 * Health Units Routes
 *
 * - Agency / Empresa SAD
 * - Retirement Homes / Lares de Idosos
 * - Senior Residences / Residências Sénior
 * - Hospitals / Hospitais
 */

const router = express.Router();
router.route('/health-units/agencies/search').get(healthUnitsController.searchAgencies);

router
  .route('/health-units/dashboard')
  .get(AuthenticationGuard, ClientGuard('business'), healthUnitsController.getDashboard);

router.route('/health-units/:id').get(healthUnitsController.retrieveHealthUnit);

export default router;
