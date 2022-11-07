
import Router from "express"
import express from "express"
import AuthenticationController from "../controllers/authentication.controller.js"
import UsersController from "../controllers/users.controller.js"

import validateAuth from "../middlewares/auth.middleware.js"

import {registerUserValidation} from "../validators/signup.validator.js"
import validatorMiddleware from "../middlewares/validator.middleware.js"


const router = express.Router()

router.route("/auth/register")
    .post(AuthenticationController.signup)

    
router.route("/auth/login") 
    .post(AuthenticationController.login)
    

router.route("/auth/logout")    
    .post(validateAuth, AuthenticationController.logout) 
    


router.route("/auth/change-password")

router.route("/auth/forgot-password")

    
  


export default router