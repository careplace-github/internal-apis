import Router from "express"
import express from "express"
import AuthenticationController from "../controllers/authentication.controller.js"
import UsersController from "../controllers/users.controller.js"

import validateAuth from "../middlewares/auth.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"

const router = express.Router()


router.route("/users")
    .get(validateAuth, roleBasedGuard("user"), UsersController.getUsers)


    
  


export default router