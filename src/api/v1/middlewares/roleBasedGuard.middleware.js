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


export default function roleBasedGuard(role) {

  return function (req, res, next) {

    console.log("test", role)

  // Check that the request contains a token
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
    
    const token = req.headers.authorization.split(" ")[1]
    const response = CognitoService.role(token)

    if (role == response) {
      next()
  }
  else {
    // Token is invalid
    // Return a 401 Unauthorized
    res.status(401).send("Unauthorized")
  }

}

else {
  // If there is no token, respond appropriately 
  res.status(401).send("No token provided.")
}
}
}
















