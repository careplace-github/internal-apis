import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"
import AwsConfig from "../helpers/cognito.helper.js"



import {AWS_user_pool_id} from "../../../config/constants/index.js"
import {AWS_client_id} from "../../../config/constants/index.js"
import {AWS_region} from "../../../config/constants/index.js"
import {AWS_identity_pool_id} from "../../../config/constants/index.js"
import {AWS_access_key_id} from "../../../config/constants/index.js"
import {AWS_secret_access_key} from "../../../config/constants/index.js"







export default class CognitoService {

  
   
  
  static signUp(email, password, agent = 'none') {
  
    return new Promise((resolve) => {
      AwsConfig.initAWS ();
      AwsConfig.setCognitoAttributeList(email,agent);
      AwsConfig.getUserPool().signUp(email, password, AwsConfig.getCognitoAttributeList(), null, function(err, result){

        

        if (err) {

          switch (err.code) {

          case 'UserNotFoundException':
              return resolve({ statusCode: 400, error: err.message || JSON.stringify(err)});
          
          case 'UsernameExistsException':
              
           case 'NotAuthorizedException':
              return resolve({ statusCode: 400, error: err.message || JSON.stringify(err)});
           case 'PasswordResetRequiredException':
              return resolve({ statusCode: 400, error: err.message || JSON.stringify(err)});
           case 'UserNotConfirmedException':
              return resolve({ statusCode: 400, error: err.message || JSON.stringify(err)});

          default:
           return resolve({ statusCode: 500, error: err.message || JSON.stringify(err)});
          }


          
        }


        


        const response = {
          username: result.user.username,
          cognitoId: result.userSub,
          userConfirmed: result.userConfirmed,
          userAgent: result.user.client.userAgent,
        }
  
       
  
  
        return resolve({ statusCode: 200, response: response });
        
      });

    });

  }


    // function that adds a user to a group after they have been registered with the signUp function above
    // use cognito.heloer.js 
    // it's giving error in the console 
    // 'Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1'
    static async addUserToGroup(email, groupName) {
      return new Promise((resolve) => {
        AwsConfig.initAWS();
        
        const params = {
          GroupName: groupName,

          UserPoolId: AWS_user_pool_id,
          Username: email,
          regiom: AWS_region,

          

        };

      


        console.log("teste");
        AwsConfig.getCognitoIdentityServiceProvider().adminAddUserToGroup(params, (err, data) => {
          if (err) {
            return resolve({ statusCode: 400, error: err });
          }
          return resolve({ statusCode: 200, response: data });
        });
      });
      

    }




    // function that registers a new user with signUp function above and then adds them to the group with addUserToGroup function above 
    static async registerUserAndAddToGroup(email, password, role, agent = 'none') {
      return new Promise((resolve) => {
        this.signUp(email, password, role, agent).then((result) => {
          if (result.statusCode === 200) {
            this.addUserToGroup(email, role).then((result) => {
              return resolve(result);
            });
          } else {
            return resolve(result);
          }
        });
      });
    }

    





        
  
  

     
        
     


      
    
/**
 static addUserToGroup(user, groupName) {
        return new Promise((resolve) => {
          AwsConfig.initAWS ();
          const params = {
            GroupName: groupName,
            UserPoolId: AwsConfig.getUserPoolId(),
            Username: user.username,
          };

          AwsConfig.getCognitoIdentityServiceProvider().adminAddUserToGroup(params, (err, data) => {
            if (err) {
              return resolve({ statusCode: 422, response: err });
            }
            return resolve({ statusCode: 200, response: data });
          }

          );
        });

      }
 */


       
   

        

    static signIn(email, password) {

      return new Promise((resolve) => {
        
        AwsConfig.getCognitoUser(email).authenticateUser(AwsConfig.getAuthDetails(email, password), {  

          onFailure: function(err) {
            const error = {
              code: err.code,
              message: err.message,
            }
            console.log("Login failed: " + JSON.stringify(error, null, 2));

            return resolve({ statusCode: 400, error: err });
          },

          onSuccess: function(result) {
            
           // console.log("Login success: " + (JSON.stringify(result, null, 2)));

            const response = {
              username: result.idToken.payload.email,
              cognitoId: result.idToken.payload.sub,
              userConfirmed: result.idToken.payload.email_verified,
              userAgent: result.idToken.payload.user_agent,
              token: result.getAccessToken().getJwtToken(),
            }
            return resolve({ statusCode: 200, response: response });
          },
          
        });
      });
    }

    static getCognitoIdFromToken(token) {
    
        
        const decoded = jwt_decode(token);

        const cognitoId = decoded.sub;

        const response = {
          cognitoId: cognitoId,
        }

        

        return cognitoId
      
    }



    // uses congito service to decode the token
    // compares the token expiry with the current time
    // returns true if token is valid
    static isLoggedIn(token) {
       
        const decoded = AwsConfig.decodeJWTToken(token);
        const currentTime = new Date().getTime() / 1000;

       return decoded.exp > currentTime
      }

      static role(token) {
        const decoded = AwsConfig.decodeJWTToken(token);
        const role = decoded['cognito:groups'][0];
        return role;
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
      
      
    

    }
