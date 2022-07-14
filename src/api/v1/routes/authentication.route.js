import Router from "express"
import user from "../models/users.model.js"
import express from "express"

import {api_url} from "../../../config/constants/index.js"
import UsersController from "../controllers/users.controller.js"
import AuthenticationController from "../controllers/authentication.controller.js"

import {RegisterUserValidations} from "../validators/users.validator.js"
import ValidationResult from "express-validation"


const router = express.Router()

router.route("/signup")
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
    .post(AuthenticationController.apiRegisterUser)


    router.route("/signin")
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
    .post(AuthenticationController.apiLoginUser)
    

    router.route("/verify")
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
    .post(AuthenticationController.apiVerifyUser)
  


export default router