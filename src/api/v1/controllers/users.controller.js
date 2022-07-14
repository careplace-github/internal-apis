//import usersHelper from "../helpers/users.helper.js"
import usersDAO from "../db/usersDAO.js"
//import usersValidator from "../validators/users.validator.js"
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

       
    

        let response 
        let cognitoId =""
        

        const name = req.body.name
        const email = req.body.email

        //const test = await usersValidator.registerUserValidator(name, email)
         
        

        try {
            //const cognitoId = await usersHelper.createCognitoUser()
            
        
               
        } catch (e) {
                //errors with aws cognito
                res.status(500).json({ error: e.message})
        }
        

        try {
            const name = req.body.name
            const email = req.body.email 
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

        next();
    
        }}


    



