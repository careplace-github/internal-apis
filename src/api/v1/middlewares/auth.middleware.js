import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"
import cognitoExpress from "cognito-express"

import CognitoService from "../services/cognito.service.js"

import {AWS_user_pool_id} from "../../../config/constants/index.js"
import {AWS_client_id} from "../../../config/constants/index.js"
import {AWS_region} from "../../../config/constants/index.js"
import {AWS_identity_pool_id} from "../../../config/constants/index.js"


let cognitoAttributeList = [];



/**
 * Middleware to validate the token
 * JWT token is passed in the header of the request
 * The token is validated using the CognitoExpress library
 * If the token is valid, the request is passed to the next middleware
 * If the token is invalid, a 401 Unauthorized is returned
 */
export default function validateAuth(req, res, next) {


  // Check that the request contains a token
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
    // Validate the token
    const token = req.headers.authorization.split(" ")[1]
    const response = CognitoService.isLoggedIn(token)

    const email = CognitoService.getEmailFromToken(token)


    
    
    if (response) {
      // Token is valid
   
      req.body.userEmail = email

   

      console.log("User authenticated")

     // Pass the request to the next middleware
      next()
    }

    else {
      // Token is invalid
      // Return a 401 Unauthorized
      console.log("User not authenticated")
      res.status(401).send("Unauthorized")
    }
    
  } else {
    // If there is no token, respond appropriately 
    console.log("No token provided")
    res.status(404).send("No token provided.")
  }
}















