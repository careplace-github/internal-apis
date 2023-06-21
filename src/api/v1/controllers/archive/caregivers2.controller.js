//import usersHelper from "../helpers/users.helper"
import usersDAO from "../db/usersDAO"
//import usersValidator from "../validators/users.validator"
// import authenticationService from "../services/authentication.service"
import User from "../models/users.model"
import { check } from "express-validator"
import validationResults from "express-validator"
import CognitoService from "../services/cognito.service"



export default class CaregiversController {


    static async getUsers(req, res, next) { 
       const users = await usersDAO.getUsers()
       res.status(200).json(users)
    }


    static async createUser(req, res, next) {

        let cognitoId
        const name = req.body.name
        const email = req.body.email 
        const password = req.body.password

       
        const userAlreadyRegistered = await usersDAO.getUserByEmail(email)
        
        if (userAlreadyRegistered != null) {
           
            return res.status(200).json({
                message: "User already exists",
                request: {
                    type: "POST",
                    url: "host/users",
                    body: {"name": name, "email": email}
                },
                user:userAlreadyRegistered
                
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
            
            console.log("aqui: " + email)
            await usersDAO.addUser(cognitoId, name, email)
            const test = await AuthenticationService.createCognitoUser(email, password)
            
            
            

          
                 
        } catch (e) {
         
            
        }

        // Send the email to the user with the link to verify their email address.
        // authenticationService.sendVerificationEmail(email, cognitoId)
        next();
    
        }}


    



