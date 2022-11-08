import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"


import CognitoService from "../services/cognito.service.js"

import {AWS_user_pool_id} from "../../../config/constants/index.js"
import {AWS_client_id} from "../../../config/constants/index.js"
import {AWS_region} from "../../../config/constants/index.js"
import {AWS_identity_pool_id} from "../../../config/constants/index.js"
import {AWS_access_key_id} from "../../../config/constants/index.js"
import {AWS_secret_access_key} from "../../../config/constants/index.js"

import usersDAO from "../db/usersDAO.js"




export default class AuthHelper {



  static async decodeToken(token) {
    return jwt_decode(token);
  }


  static async isLoggedIn(token) {

    const decodedToken = this.decodeToken(token);

    const currentTime = new Date().getTime() / 1000;

    return decodedToken.exp > currentTime


  }

 


  static async getUserId(token, authProvider) {

    let user
    let userId


    const decodedToken = await this.decodeToken(token);


 


    switch (authProvider) {
      case 'cognito':
       
      console.log("AUTH ID: " + decodedToken.sub)

         user = await usersDAO.getUserByAuthId(decodedToken.sub, 'cognito')

        userId = user._id

        return userId
        

      default:
         user = await usersDAO.getUserByAuthId(decodedToken.sub, 'cognito')

        userId = user._id

        return userId

    }
    
    
  }

  
  

}