// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

export default router;
