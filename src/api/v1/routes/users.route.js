// Import the express module
import Router from "express";
import express from "express";




// Import controllers
import UsersController from "../controllers/users.controller.js";

const router = express.Router();

router.route("/users")
  .get(UsersController.index)
  .post(UsersController.addUserToMongoDb);

router.route("/users/account")
  .get( UsersController.account);

router.route("/users/:id")
  .get(UsersController.show)
  .patch(UsersController.update)
  .put(UsersController.update)
  .delete(UsersController.destroy);

export default router;
