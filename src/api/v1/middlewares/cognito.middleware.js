import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"

import {AWS_user_pool_id} from "../../../config/constants/index.js"
import {AWS_client_id} from "../../../config/constants/index.js"
import {AWS_region} from "../../../config/constants/index.js"
import {AWS_identity_pool_id} from "../../../config/constants/index.js"


let cognitoAttributeList = [];

const poolData = { 
    UserPoolId : AWS_user_pool_id,
    ClientId : AWS_client_id,
    Region: AWS_region,
};

 const attributes = (key, value) => { 
  return {
    Name : key,
    Value : value
  }
};

export default class AuthenticationService {

  static getCognitoPoolData () {
    return poolData
  }

static setCognitoAttributeList(email, agent) {
  let attributeList = [];
  attributeList.push(attributes('email',email));
  attributeList.forEach(element => {
    cognitoAttributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(element));
  });
}

static getCognitoAttributeList() {
  return cognitoAttributeList;
}

static getUserPool(){
  return new AmazonCognitoIdentity.CognitoUserPool(poolData);
}





  static getCognitoUser(email) {
  const userData = {
    Username: email,
    Pool: this.getUserPool()
  };

  console.log( new AmazonCognitoIdentity.CognitoUser(userData) )
  
  return new AmazonCognitoIdentity.CognitoUser(userData);
}
 






static getAuthDetails(email, password) {
  var authenticationData = {
    Username: email,
    Password: password,
   };
  return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
}

static initAWS (region = AWS_region, identityPoolId = AWS_identity_pool_id) {
  AWS.config.region = region; // Region
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
  });
}


static decodeJWTToken(token) {
  const {  email, exp, auth_time , token_use, sub} = jwt_decode(token.idToken);
  return {  token, email, exp, uid: sub, auth_time, token_use };
}



static adminAuthenticate(email, password) {

 /**
  * 
  */
  // this.initAWS()
  

  if(!password){
    password = ""
  }

  AWS.config.region = AWS_region; // Region
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: AWS_identity_pool_id,
  });


  const payload = {
    ClientId: AWS_client_id,
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    UserPoolId: AWS_user_pool_id,
    AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
    }
}


return new AmazonCognitoIdentity().adminInitiateAuth(payload).promise();


}



}