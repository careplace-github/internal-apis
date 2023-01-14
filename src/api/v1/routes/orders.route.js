// Import the express module
import Router from "express"
import express from "express"





// Import controllers
import OrdersController from "../controllers/orders.controller.js"


const router = express.Router()


router.route("/orders")
    .post( OrdersController.create )





    


    
  


export default router