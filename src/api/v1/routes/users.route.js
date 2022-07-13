import Router from "express"
import user from "../models/user.model.js"
import express from "express"
import {RegisterUserValidations} from "../validators/addUser.validator.js"
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
     *     parameters: []
     *     responses:
     *       200:
     *        description: "successful operation"
     *        schema:
     */ 
    .get(UsersController.apiGetUsers)

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
    .post(UsersController.apiAddUser)
    

router.route("users/:id")
    .get(UsersController.apiGetUserById)
    .put(UsersController.apiUpdateUser)
    .delete(UsersController.apiDeleteUser)
  


export default router