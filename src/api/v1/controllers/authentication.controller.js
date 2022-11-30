// Import Cognito Service
import CognitoService from "../services/cognito.service.js";

// Import database access objects
import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

// Import auth helper
import AuthHelper from "../helpers/auth.helper.js";

export default class AuthenticationController {
  static async signup(req, res, next) {
    console.log("Attempting to create new user: \n");

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cognitoId: "",
    };

    const cognitoResponse = await CognitoService.signUp(
      newUser.email,
      newUser.password
    );

    console.log(
      "Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n"
    );

    if (cognitoResponse.error != null) {
      return res.status(400).json({
        statusCode: 400,
        error: cognitoResponse.error,
        request: {
          type: "POST",
          url: "host/signup",
          body: { name: newUser.name, email: newUser.email },
        },
      });
    }

    newUser.cognitoId = cognitoResponse.response.cognitoId;

    const mongoDbResponse = await usersDAO.addUser(
      newUser.cognitoId,
      newUser.name,
      newUser.email
    );

    console.log(
      "MongoDB Response: " + JSON.stringify(mongoDbResponse, null, 2) + "\n"
    );

    if (mongoDbResponse.error != null) {
      return res.status(400).json({
        statusCode: mongoDbResponse.statusCode,
        error: mongoDbResponse.error,
        request: {
          type: "POST",
          url: "host/signup",
          body: {
            name: mongoDbResponse.userCreated.name,
            email: mongoDbResponse.userCreated.email,
          },
        },
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "User registered successfully",
      request: {
        type: "POST",
        url: "host/signup",
        body: {
          name: mongoDbResponse.userCreated.name,
          email: mongoDbResponse.userCreated.email,
          verified: false,
        },
      },
    });
  }

  // Function to retireve user's account information from the database and return it to the client
  // This function is called when the user clicks on the "My Account" button on the client side
  // Uses the token to get the user's cognitoId and then uses the cognitoId to get the user's information from the database
  static async myAccount(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];

    console.log("Token: " + token + "\n");

    const cognitoId = await CognitoService.getCognitoIdFromToken(token);

    const user = await usersDAO.getUserByCognitoId(cognitoId);

    return res.status(200).json({
      statusCode: 200,
      message: "User information retrieved successfully",
      request: {
        type: "GET",
        url: "host/myaccount",
        body: { token: token },
      },

      // Return the user's information to the client
      response: {
        user: user,
      },
      user: user,
    });
  }

  static async login(req, res, next) {
    console.log(`Attempting to login user '${req.body.email}': \n`);

    const cognitoResponse = await CognitoService.signIn(
      req.body.email,
      req.body.password
    );

    //console.log("Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n")

    // If there is an error, return the error to the client
    if (cognitoResponse.error != null) {
      return res.status(400).json({
        statusCode: 400,
        error: cognitoResponse.error,
        request: {
          type: "POST",
          url: "host/login",
          body: { email: req.body.email, password: req.body.password },
        },
      });
    }


    console.log("Cognito Response: " + cognitoResponse.response.cognitoId);

    const user = await usersDAO.getUserByAuthId(
      cognitoResponse.response.cognitoId,
      "cognito"
    );

    const company = await companiesDAO.getCompanyByUserId(user._id);

    console.log("UserId: " + user._id + "\n");

    user.company = company;

    console.log("User: " + JSON.stringify(user, null, 2) + "\n");

    console.log("Company:" + JSON.stringify(company, null, 2) + "\n");

    return res.status(200).json({
      accessToken: cognitoResponse.response.token,
      user: user,
    });
  }

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

  // Function to change the user's password
  // This function is called when the user clicks on the "Change Password" button on the client side
  // Uses the token to get the user's cognitoId and then uses the cognitoId to change the user's password
  static async changePassword(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];

    console.log("Token: " + token + "\n");

    const decodedToken = await AuthHelper.decodeToken(token);

    
    
    console.log("Decoded Token: " + JSON.stringify(decodedToken, null, 2) + "\n");

    const cognitoResponse = await CognitoService.changePassword(
      req.body.email,
      req.body.newPassword
    );

    console.log(
      "Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n"
    );

    // If there is an error, return the error to the client
    if (cognitoResponse.error != null) {
      return res.status(400).json({
        statusCode: 400,
        error: cognitoResponse.error,
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

    // If there is no error, return a success message to the client
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

  static async forgotPassword(req, res, next) {
    console.log(`Attempting to reset user password: \n`);

    const cognitoResponse = await CognitoService.forgotPassword(req.body.email);

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
          url: "host/forgotpassword",
          body: { email: req.body.email },
        },
      });
    }

    return res.status(200).json({
      statusCode: 200,
      response: {
        message: "User password reset successfully",
      },
      request: {
        type: "POST",
        url: "host/forgotpassword",
        body: { email: req.body.email },
      },
    });
  }

  static async resetPassword(req, res, next) {
    console.log(`Attempting to confirm forgot password: \n`);

    const cognitoResponse = await CognitoService.confirmForgotPassword(
      req.body.email,
      req.body.code,
      req.body.newPassword
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
          url: "host/confirmforgotpassword",
          body: { email: req.body.email },
        },
      });
    }

    return res.status(200).json({
      statusCode: 200,
      response: {
        message: "User password reset successfully",
      },
      request: {
        type: "POST",
        url: "host/confirmforgotpassword",
        body: { email: req.body.email },
      },
    });
  }
}
