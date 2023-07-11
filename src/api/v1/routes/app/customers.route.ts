// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import ClientGuard from '../../middlewares/guards/clientGuard.middleware';

const router = express.Router();

export default router;
