// Import the express module
import Router from "express"
import express from "express"

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js"
import validateRole from "../middlewares/role.middleware.js"
import validateAccess from "../middlewares/access.middleware.js"



// Import controllers
import OrdersController from "../controllers/orders.controller.js"


const router = express.Router()


router.route("/orders")
    .post( OrdersController.create )





    


    
  


export default router