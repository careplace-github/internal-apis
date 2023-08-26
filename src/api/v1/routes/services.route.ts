// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import ServicesController from '../controllers/services.controller';

const router = express.Router();

router.route('/services').get(ServicesController.listServices);

export default router;
