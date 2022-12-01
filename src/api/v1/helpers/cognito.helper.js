import AWS from "aws-sdk";
import AWSCognito from "amazon-cognito-identity-js";
import jwt_decode from "jwt-decode";
import AmazonCognitoIdentity from "amazon-cognito-identity-js";

import CognitoService from "../services/cognito.service.js";

import { AWS_user_pool_id } from "../../../config/constants/index.js";
import { AWS_client_id } from "../../../config/constants/index.js";
import { AWS_region } from "../../../config/constants/index.js";
import { AWS_identity_pool_id } from "../../../config/constants/index.js";
import { AWS_access_key_id } from "../../../config/constants/index.js";
import { AWS_secret_access_key } from "../../../config/constants/index.js";

let cognitoAttributeList = [];

const poolData = {
  UserPoolId: AWS_user_pool_id,
  ClientId: AWS_client_id,
  Region: AWS_region,
  IdentityPoolId: AWS_identity_pool_id,
};

const attributes = (key, value) => {
  return {
    Name: key,
    Value: value,
  };
};

export default class AuthenticationService {
  static getCognitoPoolData() {
    return poolData;
  }

  static setCredentials(AWS) {
    AWS.config.region = AWS_region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: AWS_identity_pool_id,
    });
  }

  static initAWS(
    region = AWS_region,
    identityPoolId = AWS_identity_pool_id,
    userPoolId = AWS_user_pool_id,
    clientId = AWS_client_id,
    accessKeyId = AWS_access_key_id,
    secretAccessKey = AWS_secret_access_key
  ) {
    AWS.config.region = region; // Region

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId,

      // add credentials here
      accessSecretKey: AWS_secret_access_key,
      accessKeyId: AWS_access_key_id,
    });

    AWS.CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider(
      {
        apiVersion: "2016-04-18",
        region: AWS_region,
        accessKeyId: AWS_access_key_id,
        secretAccessKey: AWS_secret_access_key,
      }
    );
  }

  // function to get the user pool
  // What is User Pool?
  // A user pool is a user directory in Amazon Cognito. It provides sign-up and sign-in options for your app users.
  //
  static getUserPool() {
    return new AmazonCognitoIdentity.CognitoUserPool(poolData);
  }

  // function to get the current user
  // how does it work?
  // https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
  static getCurrentUser() {
    return this.getUserPool().getCurrentUser();
  }

  static setCognitoAttributeList(email, agent) {
    let attributeList = [];
    attributeList.push(attributes("email", email));
    attributeList.forEach((element) => {
      cognitoAttributeList.push(
        new AmazonCognitoIdentity.CognitoUserAttribute(element)
      );
    });
  }

  static getCognitoAttributeList() {
    return cognitoAttributeList;
  }

  static getCognitoUser(email) {
    const userData = {
      Username: email,
      Pool: this.getUserPool(),
    };

    return new AmazonCognitoIdentity.CognitoUser(userData);
  }

  // Return a Cognito User from the token
  static getCognitoUserFromToken(token) {
    var cognitoUser = this.getUserPool().getCurrentUser();
    return cognitoUser;
  }

  static getAuthDetails(email, password) {
    var authenticationData = {
      Username: email,
      Password: password,
    };
    return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  }

  // function to decode the token
  static decodeJWTToken(token) {
    // print the decoded JWT token as json
    console.log(JSON.stringify(jwt_decode(token), null, 2));

    console.log;
    return jwt_decode(token);
  }

  static getUserPoolId() {
    return AWS_user_pool_id;
  }

  static adminAuthenticateUser(
    cognitoidentityserviceprovider,
    token,
    authFlow
  ) {
    let email;
    let password;

    console.log("ClientId: " + AWS_client_id);
    console.log("UserPoolId: " + AWS_user_pool_id);

    const payload = {
      ClientId: AWS_client_id,
      AuthFlow: authFlow || "ADMIN_NO_SRP_AUTH",
      UserPoolId: AWS_user_pool_id,
      AuthParameters: {
        REFRESH_TOKEN: token,
        USERNAME: email || "crm@carely.pt",
        PASSWORD: password || "Password123",
      },
    };

    return new Promise((resolve, reject) => {
      cognitoidentityserviceprovider.adminInitiateAuth(payload, (err, data) => {
        if (err) {
          console.log("ERRO DENTRO HELPER AUTHENTICATE: " + err, err.stack); // an error occurred
          reject(err);
        } else {
          console.log("ERRO DENTRO HELPER AUTHENTICATE: " + data); // successful response
          resolve(data);
        }
      });
    });
  }
}
