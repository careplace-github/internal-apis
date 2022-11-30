import AWS from "aws-sdk";
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

  static getCognitoIdentityServiceProvider() {
    return new AWS.CognitoIdentityServiceProvider();
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

  static getUserPool() {
    return new AmazonCognitoIdentity.CognitoUserPool(poolData);
  }

  static getCognitoUser(email) {
    const userData = {
      Username: email,
      Pool: this.getUserPool(),
    };

    return new AmazonCognitoIdentity.CognitoUser(userData);
  }

  static getCognitoUserFromToken(token) {
    const { email } = this.decodeJWTToken(token);
    return this.getCognitoUser(email);
  }

  static getAuthDetails(email, password) {
    var authenticationData = {
      Username: email,
      Password: password,
    };
    return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  }

  static setCredentials() {
    AWS.config.region = AWS_region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: AWS_identity_pool_id,
    });
  }





  // functio to
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

  // function to add a user to a group
  // it's giving error in the console
  // 'Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1'
  static adminAddUserToGroup(email, groupname) {
    var params = {
      GroupName: groupname /* required */,
      UserPoolId: AWS_user_pool_id /* required */,
      Username: email /* required */,
    };

    var cognitoidentityserviceprovider =
      new AWS.CognitoIdentityServiceProvider();

    console.log(AWS.cognitoidentityserviceprovider.credentials.accessKeyId);
    console.log(AWS.cognitoidentityserviceprovider.credentials.secretAccessKey);

    cognitoidentityserviceprovider.adminAddUserToGroup(
      params,
      function (err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
          reject(err);
        } else {
          console.log(data); // successful response
          resolve(data);
        }
      }
    );
  }

  static adminAuthenticate(email, password) {
    /**
     *
     */
    // this.initAWS()

    if (!password) {
      password = "";
    }

    AWS.config.region = AWS_region; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: AWS_identity_pool_id,
      // add credentials here
      accessSecretKey: AWS_secret_access_key,
      accessKeyId: AWS_access_key_id,
    });

    const payload = {
      ClientId: AWS_client_id,
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      UserPoolId: AWS_user_pool_id,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    return new AmazonCognitoIdentity().adminInitiateAuth(payload).promise();
  }
}
