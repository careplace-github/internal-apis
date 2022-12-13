// Import the express module
import Router from "express";
import express from "express";

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js";
import validateRole from "../middlewares/role.middleware.js";
import validateAccess from "../middlewares/access.middleware.js";

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
