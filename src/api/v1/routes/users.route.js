import Router from "express"
import user from "../models/user.model.js"
import express from "express"
import {RegisterUserValidations} from "../validators/user.validator.js"
import {api_url} from "../../../config/constants/index.js"
import UsersController from "../controllers/users.controller.js"


const router = express.Router()

router.route("/users")
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
     *     produces:
     *     - "application/json"
     *     parameters: []
     *     responses:
     *       200:
     *        description: "successful operation"
     *        schema:
     */ 
    .get(UsersController.apiGetUsers)


    .post(UsersController.apiAddUser)
    

router.route("users/:id")
    .get(UsersController.apiGetUserById)
    .put(UsersController.apiUpdateUser)
    .delete(UsersController.apiDeleteUser)
  


export default router