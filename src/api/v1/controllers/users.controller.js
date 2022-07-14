//import usersHelper from "../helpers/users.helper.js"
import usersDAO from "../db/usersDAO.js"
//import usersValidator from "../validators/users.validator.js"
// import authenticationService from "../services/authentication.service.js"
import User from "../models/users.model.js"
import { check } from "express-validator"




import validationResults from "express-validator"
const validationResult = validationResults.validationResult;

export default class UsersController {


    static async apiGetUsers(req, res, next) { 
        let response 
        res.json(response)
    //    res.json("Hello world")
    }


    static async createUser(req, res, next) {

        let cognitoId
        const name = req.body.name
        const email = req.body.email 

       
        const userAlreadyRegistered = await usersDAO.getUserByEmail(email)
        console.log(userAlreadyRegistered)
        if (userAlreadyRegistered != null) {
             res.status(400).json({
                error: "User already registered"
            })
        }
        
        try {
            //const cognitoId = await authenticationService.createCognitoUser()
            // const cognitoId = req.body.cognitoId
        
               
        } catch (e) {
                //errors with aws cognito
                res.status(500).json({ error: e.message})
        }
        

        try {
            
            await usersDAO.addUser(cognitoId, name, email)
            
            console.log(`email: ${email}`)

            res.status(200).json({
                message: "User created",
                request: {
                    type: "POST",
                    url: "host/users",
                    body: {"name": name, "email": email}
                }
                
            })
                 
        } catch (e) {
         
            
        }

        // Send the email to the user with the link to verify their email address.
        // authenticationService.sendVerificationEmail(email, cognitoId)
        next();
    
        }}


    



