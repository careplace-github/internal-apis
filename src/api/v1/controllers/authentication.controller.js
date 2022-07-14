import usersHelper from "../helpers/users.helper.js"
import usersDAO from "../db/usersDAO.js"
import User from "../models/users.model.js"
import { check } from "express-validator"

import {RegisterUserValidations} from "../validators/users.validator.js"
import validationResult from "express-validator"


export default class AuthenticationController {


    static async registerUser(req, res, next) { 
        const validation = validationResult(req)
        if (!validation.isEmpty()) {
            res.status(500).json({
                errors: validation.array()
            })
        }
        let response 
        res.json("Hello world")
    }


    static async loginUser(req, res, next) {
        let response 
        let cognitoId

        let errors = validationResult(req)

        if (errors){
            res.status(500).json({
                errors: errors.array
            })
        }
         
        

        try {
            //const cognitoId = await usersHelper.createCognitoUser()
            
        
               
        } catch (e) {
                //errors with aws cognito
                res.status(500).json({ error: e.message})
        }
        

        try {
            const name = req.body.name
            const email = req.body.email 
            const response = await usersDAO.addUser(cognitoId, name, email)
            
            console.log(`email: ${email}`)

            res.status(200).json({
                message: "User created",
                request: {
                    type: "POST",
                    url: "host/users",
                    body: {name: "name", email: "email"}
                }

            })
                 
        } catch (e) {
         
            res.status(500).json({ error: e.message})
        }


    
        }



   
    static async apiVerifyUser(req, res, next) {
        let response 
        res.json(response)
    }
    static async apiUpdateUser(req, res, next) {
        let response 
        res.json(response)
    }
    static async apiDeleteUser(req, res, next) {
        let response 
        res.json(response)
    }

}
