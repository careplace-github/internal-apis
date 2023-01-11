// Import the express module
import Router from "express"
import express from "express"

// Import middlewares

// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"





// Import controllers
import EmailsController from "../controllers/emails.controller.js"


const router = express.Router()


router.route("/emails/templates")
    .get(EmailsController.index)

    router.route("/emails/send/template/:name")
    .post(EmailsController.sendEmailWithTemplate)


    
router.route("/emails/templates/:name")
    .get(EmailsController.show)
    .post(EmailsController.getEmailWithVariables)



   





    


    
  


export default router