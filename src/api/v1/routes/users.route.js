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

router
  .route("/users")
  // Test route
  .get(validateAuth, validateRole(["admin"]), UsersController.getUsers)
  .post(validateAuth, validateRole(["admin"]), UsersController.createUser);

// router to get user information by id
router
  .route("/users/:id")
  .get(validateAuth, validateAccess, UsersController.getUser)
  .put(validateAuth, validateAccess, UsersController.updateUser)
  .delete(
    validateAuth,
    validateRole(["admin", "companyOwner"]),
    UsersController.deleteUser
  );

router.route("/users/my-account").get(validateAuth, UsersController.getAccount);

export default router;
