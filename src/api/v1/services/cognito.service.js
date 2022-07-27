import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"
import AwsConfig from "../middlewares/cognito.middleware.js"



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

       
            return resolve({ statusCode: 201, message: "Created Cognito User successfuly", response: response });
          });
        });
    }

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
            
            console.log("Login success: " + (JSON.stringify(result, null, 2)));

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


    static getSession(email) {
      return new Promise((resolve) => {
       


        AwsConfig.getCognitoUser(email).getSession(function(err, session) {
        
          if (err) {
            return resolve({ statusCode: 400, error: err });
          }


          return resolve({ statusCode: 200, response: session });
        });
      });

    }


     // function to logout a user with the provided email and session token
     static logout(email, token) {
      
      
      return new Promise((resolve) => {

        this.getSession(email)

        AwsConfig.getCognitoUser(email).signOut(function(err, result) { 
          if (err) {
          
            return resolve({ statusCode: 400, error: err });
          }

          console.log("Logged success");

          return resolve({ statusCode: 200, response: result });
        } )


       
      });

    
    }

    
    

       

    // function to verify if a user is logged in
    // if a user is not logged in log them in with the provided email and token
    // if a user is logged in, return the user
    static authenticateUser(email, token ) {

      return new Promise((resolve) => {
        AwsConfig.getCognitoUser(email).getSession( (err, result) => {
          if (err) {
            return resolve({ statusCode: 400, error: err });
          }

          const response = {
            username: result.idToken.payload.email,
            cognitoId: result.idToken.payload.sub,
            userConfirmed: result.idToken.payload.email_verified,
            userAgent: result.idToken.payload.user_agent,
            token: result.getAccessToken().getJwtToken(),
          }

          return resolve({ statusCode: 200, response: response });
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
      
      
    

    }
