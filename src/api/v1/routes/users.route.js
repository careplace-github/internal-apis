// Import the express module
import Router from "express"
import express from "express"

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js"
import validateRole from "../middlewares/role.middleware.js"

// Import controllers
import UsersController from "../controllers/users.controller.js"


const router = express.Router()


router.route("/users")
    // Test route
    .get(validateAuth, validateRole("user"), UsersController.getUsers)


router.route("/users/my-account")
    .get(validateAuth, UsersController.getAccount)





    


    
  


export default router