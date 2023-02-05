'use strict'

import Router from "express"
import user from "../models/users.model.js"
import express from "express"


import {api_url} from "../../../config/constants/index.js"
import {registerUserValidation} from "../validators/signup.validator.js"
import validatorMiddleware from "../middlewares/validator.middleware.js"






const router = express.Router()


router.route("/caregivers")
    
    
    /** 
     * @swagger 
     * 
     * /api/v1/users: 
     *   get: 
     *     tags: 
     *     - "Users"
     *     summary: Get all users
     *     description: Get all users
     *     operationId: getUsers
     *     parameters: []
     *     responses:
     *       200:
     *        description: "successful operation"
     *        schema:
     */ 
   

    /** 
     * @swagger 
     * 
     * /api/v1/users: 
     *   post: 
     *     tags: 
     *     - "Users"
     *     summary: Add user
     *     description: Add a new user 
     *     operationId: getUsers
     *     parameters: []
     *     responses:
     *       200:
     *        description: "successful operation"
     *        schema:
     */ 
    //.post(validateUser)
    //.post(CaregiversController.createUser)

 
    

//router.route("users/:id")

  


export default router