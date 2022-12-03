// Import Cognito Service
import CognitoService from "../services/cognito.service.js";

// Import database access objects
import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

// Import logger
import logger from "../../../logs/logger.js";

export default class AuthenticationController {
  // Function to create a new user
  static async signup(req, res, next) {
    logger.info("Attempting to create new user: \n");

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cognitoId: "",
    };

    logger.info("Params: " + JSON.stringify(newUser, null, 2) + "\n");

    const cognitoResponse = await CognitoService.signUp(
      newUser.email,
      newUser.password
    );

    logger.info(
      "Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n"
    );

    // 
    if (cognitoResponse.error != null) {
      logger.error("Cognito Signup Error: " + cognitoResponse.error + "\n");
      return res.status(400).json({
        statusCode: 400,
        error: cognitoResponse.error,
        request: {
          type: "POST",
          url: "host/signup",
          body: { newUser },
        },
      });
    }

    newUser.cognitoId = cognitoResponse.UserSub;

    const mongoDbResponse = await usersDAO.addUser(newUser);

    logger.info(
      "MongoDB Response: " + JSON.stringify(mongoDbResponse, null, 2) + "\n"
    );

    if (mongoDbResponse.error != null) {
      logger.error("MongoDB Fetch User Error: " + mongoDbResponse.error + "\n");

      return res.status(400).json({
        statusCode: mongoDbResponse.statusCode,
        error: mongoDbResponse.error,
        request: {
          type: "POST",
          url: "host/signup",
          body: {
            newUser,
          },
        },
      });
    } else {
      logger.info(
        "User created successfully: " + mongoDbResponse.userCreated + "\n"
      );

      return res.status(200).json({
        statusCode: 200,
        message: "User registered successfully",
        request: {
          type: "POST",
          url: "host/signup",
          body: {
            user: {
              name: newUser.name,
              email: newUser.email,
              verified: false,
            },
          },
        },
      });
    }
  }

  // Function to login a user
  static async login(req, res, next) {
   
    logger.info(`Attempting to login user '${req.body.email}': \n`);

    let cognitoUser
    let accessToken

    try {
      const cognitoResponse = await CognitoService.authenticateUser(
        req.body.email,
        req.body.password
      );

      logger.info(
        "Cognito Response: " + JSON.stringify(cognitoResponse) + "\n"
      );

      try {
        accessToken = cognitoResponse.AuthenticationResult.AccessToken
         cognitoUser = await CognitoService.getUserDetails(accessToken);

         logger.info("Cognito User: " + JSON.stringify(cognitoUser, null, 2) + "\n");
      } catch (error) {
        logger.error("Cognito Fetch User Error: " + error + "\n");
        return res.status(400).json({
          statusCode: 400,
          error: error.message || JSON.stringify(error),
          request: {
            type: "POST",
            url: "host/login",
            body: {
              email: req.body.email,
            },
          },
        });
      }
    } catch (error) {
      logger.error("Cognito Authentication Error: " + error + "\n");
      return res.status(400).json({
        statusCode: 400,
        error: error.message || JSON.stringify(error),
        request: {
          type: "POST",
          url: "host/login",
          body: {
            email: req.body.email,
          },
        },
      });
    }

    try {

     

      const user = await usersDAO.getUserByAuthId(
        cognitoUser.UserAttributes[0].Value,
        "cognito"
      );
      logger.info("MongoDB User: " + JSON.stringify(user, null, 2) + "\n");

      // If the user is null return an error
      if (user == null) {
        logger.warn("User not found in MongoDB. Query done with CognitoId: " + cognitoUser.UserAttributes[0].Value + "\n" );
        return res.status(400).json({
          statusCode: 400,
          error: "User not found",
          request: {
            type: "POST",
            url: "host/login",
            body: {
              email: req.body.email,
            },
          },
        });
      }


      if (user.role != null && user.role != "user") {
        try {
          const company = await companiesDAO.getCompanyByUserId(user._id);

          if(company == null) {
            logger.warn("Company not found in MongoDB. Query done with UserId: " + user._id + "\n" );
          }

          logger.info("MongoDB Company: " + JSON.stringify(company, null, 2) + "\n");
          user.company = company;
          logger.info("User: " + JSON.stringify(user, null, 2) + "\n");

          // Return the user populated with the company
          return res.status(200).json({
            statusCode: 200,
            message: "User logged in successfully",
            request: {
              type: "POST",
              url: "host/login",
              body: {
                email: req.body.email,
              },
            },
            response: {
              accessToken: accessToken,
              user: user,
            }
          });
        } catch (error) {
          logger.error("MongoDB Fetch Company Error: " + error + "\n");
          return res.status(400).json({
            statusCode: 400,
            error: error.message || JSON.stringify(error),
            request: {
              type: "POST",
              url: "host/login",
              body: {
                email: req.body.email,
              },
            },
          });
        }
      } else {
        // If for any reason cannot find a company, return the user without the company field
        return res.status(200).json({
          statusCode: 200,
          message: "User logged in successfully",
          request: {
            type: "POST",
            url: "host/login",
            body: {
              email: req.body.email,
            },
          },
          response: {
            accessToken: accessToken,
            user: user,
          }
        });
      }
    } catch (error) {
      logger.error("MongoDB Fetch User Error: " + error + "\n");
      return res.status(400).json({
        statusCode: 400,
        error: error.message || JSON.stringify(error),
        request: {
          type: "POST",
          url: "host/login",
          body: {
            email: req.body.email,
          },
        },
      });
    }
  }

  // Function to change the user's password
  // This function is called when the user clicks on the "Change Password" button on the client side
  // Uses the token to get the user's cognitoId and then uses the cognitoId to change the user's password
  static async changePassword(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];

    logger.info(`Attempting to change password with the token: ${token} \n`);

    try {
      const cognitoResponse = await Cognito.changeUserPassword(
        token,
        req.body.oldPassword,
        req.body.newPassword
      );

      logger.info(
        "Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n"
      );

      if (cognitoResponse.error != null) {
        return res.status(400).json({
          statusCode: 400,
          error: cognitoResponse.error,
          request: {
            type: "POST",
            url: "host/changepassword",
          },
        });
      } else {
        return res.status(200).json({
          statusCode: 200,
          message: "Password changed successfully",
          request: {
            type: "POST",
            url: "host/changepassword",
            body: {
              oldPassword: req.body.oldPassword,
              newPassword: req.body.newPassword,
            },
          },
        });
      }
    } catch (error) {
      logger.error("Error changing the user's password"+ error);

      // return the error to the client
      return res.status(400).json({
        statusCode: 400,
        error: error,
        request: {
          type: "POST",
          url: "host/changepassword",
        },
      });
    }
  }

  // Function to logout a user
  static async logout(req, res, next) {
    console.log(`Attempting to logout user '${req.body.email}': \n`);

    const cognitoResponse = await CognitoService.logout(
      req.body.email,
      req.body.token
    );

    //console.log("Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n")

    if (cognitoResponse.error != null) {
      return res.status(400).json({
        statusCode: 400,
        response: {
          error: {
            code: cognitoResponse.error.code,
            message: cognitoResponse.error.message,
          },
        },
        request: {
          type: "POST",
          url: "host/logout",
          body: { email: req.body.email },
        },
      });
    }

    return res.status(200).json({
      statusCode: 200,
      response: {
        message: "User logged out successfully",
      },
      request: {
        type: "POST",
        url: "host/logout",
        body: { email: req.body.email },
      },
    });
  }

  // Function to send an email to the user's email address to reset their password with a code
  static async forgotPassword(req, res, next) {
    console.log(`Attempting to reset user password: \n`);

    try {
      const cognitoResponse = await Cognito.resetUserPassword(req.body.email);

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        return res.status(400).json({
          statusCode: 400,
          error: cognitoResponse.error,
          request: {
            type: "POST",
            url: "host/forgotpassword",
            body: { email: req.body.email },
          },
        });
      }

      // If there is no error, return the response to the client
      return res.status(200).json({
        statusCode: 200,
        response: {
          message: "Password reset email sent successfully",
        },
        request: {
          type: "POST",
          url: "host/forgotpassword",
          body: { email: req.body.email },
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(400).json({
        statusCode: 400,
        error: error,
        request: {
          type: "POST",
          url: "host/forgotpassword",
          body: { email: req.body.email },
        },
      });
    }
  }

  // Function to resend the confirmation code to the user's email address
  static async resendVerificationCode(req, res, next) {}

  // Function to resend the confirmation code to the user's email
  // This function is called when the user clicks on the "Resend Confirmation Code" button on the client side
  static async resendForgotPasswordCode(req, res, next) {
    console.log(`Attempting to resend confirmation code: \n`);

    try {
      const cognitoResponse = await Cognito.resendConfirmationCode(
        req.body.email
      );

      console.log(
        "Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n"
      );

      if (cognitoResponse.error != null) {
        return res.status(400).json({
          statusCode: 400,
          response: {
            error: {
              code: cognitoResponse.error.code,
              message: cognitoResponse.error.message,
            },
          },
          request: {
            type: "POST",
            url: "host/resendconfirmationcode",
            body: { email: req.body.email },
          },
        });
      }

      return res.status(200).json({
        statusCode: 200,
        response: {
          message: "Confirmation code sent successfully",
        },
        request: {
          type: "POST",
          url: "host/resendconfirmationcode",
          body: { email: req.body.email },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Function to confirm the user's email address after registration using the confirmation code sent to the user's email address
  static async verifyUser(req, res, next) {
    console.log(`Attempting to confirm user email: ${req.body.email} \n`);

    try {
      const cognitoResponse = await CognitoService.confirmUser(
        req.body.email,
        req.body.code
      );

      console.log(
        "Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n"
      );

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        return res.status(400).json({
          statusCode: 400,
          response: {
            error: {
              code: cognitoResponse.error.code,
              message: cognitoResponse.error.message,
            },
          },
          request: {
            type: "POST",
            url: "host/confirmemail",
            body: { email: req.body.email },
          },
        });

        // If there is no error, return the success message to the client
      } else {
        console.log("User confirmed successfully: " + req.body.email + "\n");

        return res.status(200).json({
          statusCode: 200,
          response: {
            message: "User email confirmed successfully",
          },
          request: {
            type: "POST",
            url: "host/confirmemail",
            body: { email: req.body.email },
          },
        });
      }
    } catch (error) {
      console.log(error);

      // return the error to the client
      return res.status(400).json({
        statusCode: 400,
        error: error,
        request: {
          type: "POST",
          url: "host/confirmemail",
          body: { email: req.body.email },
        },
      });
    }
  }

  // Function to confirm the user's password reset
  static async verifyForgotPasswordCode(req, res, next) {
    console.log(`Attempting to confirm user password reset: \n`);

    try {
      const cognitoResponse = await Cognito.changeUserPasswordWithCode(
        req.body.email,
        req.body.code,
        req.body.newPassword
      );

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        return res.status(400).json({
          statusCode: 400,
          error: cognitoResponse.error,
          request: {
            type: "POST",
            url: "host/confirmforgotpassword",
            body: {
              email: req.body.email,
              code: req.body.code,
              password: req.body.password,
            },
          },
        });
      }

      // If there is no error, return the response to the client
      return res.status(200).json({
        statusCode: 200,
        response: {
          message: "Password reset successfully",
        },
        request: {
          type: "POST",
          url: "host/confirmforgotpassword",
          body: {
            email: req.body.email,
            code: req.body.code,
            password: req.body.password,
          },
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(400).json({
        statusCode: 400,
        error: error,
        request: {
          type: "POST",
          url: "host/confirmforgotpassword",
          body: {
            email: req.body.email,
            code: req.body.code,
            password: req.body.password,
          },
        },
      });
    }
  }
}
