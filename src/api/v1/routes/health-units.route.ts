// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import HealthUnitsController from '../controllers/health-units.controller';

/**
 * Health Units Routes
 *
 * - Agency / Empresa SAD
 * - Retirement Homes / Lares de Idosos
 * - Senior Residences / Residências Sénior
 * - Hospitals / Hospitais
 */

const router = express.Router();
router.route('/health-units/agencies/search').get(HealthUnitsController.searchAgencies);

router.route('/health-units/:id').get(HealthUnitsController.retrieveHealthUnit);

export default router;
