// Import the express module
import express from "express"



// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";
import {
  AddOrderValidator,
  UpdateOrderValidator,
} from "../validators/orders.validator.js";



// Import Controller
import OrdersController from "../controllers/orders.controller.js"


const router = express.Router()


router.route("/orders")
    .get( OrdersController.index )
    .post( AddOrderValidator,InputValidation, OrdersController.create )


 router.route("/orders/:id")
    .get( OrdersController.show )   
    .put(UpdateOrderValidator, InputValidation, OrdersController.update )
    .delete( OrdersController.destroy )







    


    
  


export default router