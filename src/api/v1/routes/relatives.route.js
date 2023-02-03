import express from "express";

import RelativesController from "../controllers/relatives.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";
import AccessGuard from "../middlewares/guards/accessGuard.middleware.js";

const router = express.Router();

router
  .route("/users/relatives")
  .post(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    RelativesController.create
  )
  .get(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    RelativesController.listRelatives
  );

router
  .route("/users/relatives/:id")
  .get(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    RelativesController.retrieve
  )
  .put(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    RelativesController.update
  )
  .delete(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    RelativesController.delete
  );

export default router;
