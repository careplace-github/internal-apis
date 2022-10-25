import Router from "express"
import express from "express"
import AuthenticationController from "../controllers/authentication.controller.js"
import UsersController from "../controllers/users.controller.js"

import {registerUserValidation} from "../validators/signup.validator.js"
import validatorMiddleware from "../middlewares/validator.middleware.js"


const router = express.Router()

router.route("/auth/register")

    // .post(registerUserValidation, validatorMiddleware, AuthenticationController.signup) => create user using own validator

    // create user using cognito validator
    .post(AuthenticationController.signup)

    
router.route("/auth/login") 
    .post(AuthenticationController.login)

router.route("/auth/logout")    
    .post(AuthenticationController.logout)    

router.route("/users")
    .get(UsersController.getUsers)

router.route("/users/:id")
    .get(AuthenticationController.isAuthenticated, UsersController.getUserById)
    .put(AuthenticationController.isAuthenticated, UsersController.updateUser)
    .delete(AuthenticationController.isAuthenticated, UsersController.deleteUser)
    
  


export default router