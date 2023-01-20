// Import the express module
import Router from "express";
import express from "express";




// Import controllers
import UsersController from "../controllers/users.controller.js";

const router = express.Router();

router.route("/users")
  .get(UsersController.index)
 

router.route("/users/account")
  .get( UsersController.account);



export default router;
