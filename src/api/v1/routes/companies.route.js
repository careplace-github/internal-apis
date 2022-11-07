// Import the express module
import Router from "express"
import express from "express"

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js"
import validateRole from "../middlewares/role.middleware.js"

// Import controllers
import companiesController from "../controllers/companies.controller.js"



const router = express.Router()



router.route("/companies/")
    .get(validateAuth, validateRole("admin"), companiesController.getCompanies)


  

    
  


export default router