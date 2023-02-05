import express from "express";

// Import controllers
import EmailsController from "../controllers/emails.controller.js";

const router = express.Router();

router.route("/emails/templates").get(EmailsController.index);

router
  .route("/emails/send/template/:name")
  .post(EmailsController.sendEmailWithTemplate);

router
  .route("/emails/templates/:name")
  .get(EmailsController.show)
  .post(EmailsController.getEmailWithVariables);

export default router;
