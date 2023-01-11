// Import the express module
import Router from "express"
import express from "express"


// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"



// Import controllers
import OrdersController from "../controllers/orders.controller.js"


const router = express.Router()


router.route("/orders")
    .post( OrdersController.create )





    


    
  


export default router