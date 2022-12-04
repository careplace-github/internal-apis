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
  .get(validateAuth, validateRole(["admin"]), UsersController.getUsers);
//.post(validateAuth, validateRole(["admin","companyOwner","companyBoard"]), UsersController.createUser);

router.route("/users/account").get(validateAuth, UsersController.getAccount);

router
  .route("/users/:id")
  .get(
    validateAuth,
    validateAccess,
    validateRole(["admin", "companyOwner", "comoanyBoard"]),
    UsersController.getUser
  )
  .put(
    validateAuth,
    validateAccess,
    validateRole(["admin", "companyOwner", "comoanyBoard"]),
    UsersController.updateUser
  )
  .delete(
    validateAuth,
    validateAccess,
    validateRole(["admin", "companyOwner", "comoanyBoard"]),
    UsersController.deleteUser
  )

router
  .route("/users/:companyId")
  .get(validateAuth, UsersController.getUsersByCompanyId)
  .post(validateAuth, UsersController.createUser);

export default router;
