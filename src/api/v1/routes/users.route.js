// Import the express module
import Router from "express";
import express from "express";


// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"

// Import controllers
import UsersController from "../controllers/users.controller.js";

const router = express.Router();

router.route("/users")
  .get(UsersController.index)
  .post(UsersController.create);

router.route("/users/account")
  .get( UsersController.account);

router.route("/users/:id")
  .get(UsersController.show)
  .patch(UsersController.update)
  .put(UsersController.update)
  .delete(UsersController.destroy);

export default router;
