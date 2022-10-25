import Router from "express"
import express from "express"
import AuthenticationController from "../controllers/authentication.controller.js"
import UsersController from "../controllers/users.controller.js"

import {registerUserValidation} from "../validators/signup.validator.js"
import validatorMiddleware from "../middlewares/validator.middleware.js"


const router = express.Router()

router.route("/")
    .get(function(req,res) {
        res.send("<html><h1> [DEVELOPMENT ENVIRONMENT] API V0.1.2 </h1></html>");})
        

  


export default router