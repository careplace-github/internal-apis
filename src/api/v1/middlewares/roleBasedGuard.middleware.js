import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"
import cognitoExpress from "cognito-express"

import CognitoService from "../services/cognito.service.js"

import {AWS_user_pool_id} from "../../../config/constants/index.js"
import {AWS_client_id} from "../../../config/constants/index.js"
import {AWS_region} from "../../../config/constants/index.js"
import {AWS_identity_pool_id} from "../../../config/constants/index.js"

import AwsConfig from "../helpers/cognito.helper.js"
import usersDAO from "../db/usersDAO.js"




let cognitoAttributeList = [];


export default function roleBasedGuard(role) {

  return function (req, res, next) {

    

  // Check that the request contains a token
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
    
    const token = req.headers.authorization.split(" ")[1]

    const decodedToken = AwsConfig.decodeJWTToken(token);

    console.log("decodedToken: " + JSON.stringify(decodedToken))


    // Asynchronously get the user from the database
    usersDAO.getUserByEmail(decodedToken.email).then((user) => {

    

    let userRole
    
    usersDAO.getUserRoleByCognitoId(decodedToken.sub).then((userRole) => {

      console.log("userRole: " + userRole)
    
      if (userRole === role) {
        // User is authorized
        next()
      }

      else {
        // User is not authorized
        res.status(403).send("Forbidden")
      }
    })
  })

    
}

else {
  // If there is no token, respond appropriately 
  res.status(401).send("No token provided.")
}
}
}
















