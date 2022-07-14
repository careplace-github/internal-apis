import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"
import AwsConfig from "../middlewares/cognito.middleware.js"



export default class CognitoService {

    static createCognitoUser(email, password, agent = 'none') {
  
      return new Promise((resolve) => {
        AwsConfig.initAWS ();
        AwsConfig.setCognitoAttributeList(email,agent);
        AwsConfig.getUserPool().signUp(email, password, AwsConfig.getCognitoAttributeList(), null, function(err, result){
          if (err) {
            return resolve({ statusCode: 422, response: err });
          }
          const response = {
            username: result.user.username,
            cognitoId: result.userSub,
            // userConfirmed: result.userConfirmed,
            // userAgent: result.user.client.userAgent,
          }
            return resolve({ statusCode: 201, response: response });
          });
        });
    }

          
   
      
      static verify(email, code) {
        return new Promise((resolve) => {
          AwsConfig.getCognitoUser(email).confirmRegistration(code, true, (err, result) => {
            if (err) {
              return resolve({ statusCode: 422, response: err });
            }
            return resolve({ statusCode: 400, response: result });
          });
        });
      }
      
      static signIn(email, password) {
        return new Promise((resolve) => {
          AwsConfig.getCognitoUser(email).authenticateUser(AwsConfig.getAuthDetails(email, password), {
            onSuccess: (result) => {
              const token = {
                accessToken: result.getAccessToken().getJwtToken(),
                idToken: result.getIdToken().getJwtToken(),
                refreshToken: result.getRefreshToken().getToken(),
              }  
              return resolve({ statusCode: 200, response: AwsConfig.decodeJWTToken(token) });
            },
            
            onFailure: (err) => {
              return resolve({ statusCode: 400, response: err.message || JSON.stringify(err)});
            },
          });
        });
      }
    }