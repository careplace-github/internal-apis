
import CognitoService from "../services/cognito.service.js"
import usersDAO from "../db/usersDAO.js"



export default class AuthenticationController {


    static async signup(req, res, next) {

           

    console.log("Attempting to create new user: \n")    

    const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cognitoId: ""
    }    
        
    const cognitoResponse = await CognitoService.signUp(newUser.email, newUser.password)

    console.log("Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n")


    if(cognitoResponse.error != null){

        return res.status(400).json({
            statusCode: 400,
            error: cognitoResponse.error,
            request: {
                type: "POST",
                url: "host/signup",
                body: {"name": newUser.name, "email": newUser.email}
            }})
    }

    

    newUser.cognitoId = cognitoResponse.response.cognitoId
    
    const mongoDbResponse = await usersDAO.addUser(newUser.cognitoId, newUser.name, newUser.email)


    console.log("MongoDB Response: " + JSON.stringify(mongoDbResponse, null, 2) + "\n")

    if(mongoDbResponse.error != null){

        return res.status(400).json({
            statusCode: mongoDbResponse.statusCode,
            error: mongoDbResponse.error,
            request: {
                type: "POST",
                url: "host/signup",
                body: {"name": mongoDbResponse.userCreated.name, "email": mongoDbResponse.userCreated.email}
            }})
    }



    return res.status(200).json({
        statusCode: 200,
        message: "User registered successfully",
        request: {
            type: "POST",
            url: "host/signup",
            body: {"name": mongoDbResponse.userCreated.name, "email": mongoDbResponse.userCreated.email, "verified": false}
        }})
     }



    static async login (req, res, next) { 

        console.log(`Attempting to login user '${req.body.email}': \n`)    
        
        const cognitoResponse = await CognitoService.signIn(req.body.email, req.body.password)
        

        //console.log("Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n")


        if(cognitoResponse.error != null){

            return res.status(400).json({
                
            })
        }
        console.log(cognitoResponse.response.token)  

        const user = await usersDAO.getUserByCognitoId(cognitoResponse.response.cognitoId)

      return res.status(200).json({
        accessToken: cognitoResponse.response.token,
        user: user
    })
    }

    static async logout(req, res, next) {

        console.log(`Attempting to logout user '${req.body.email}': \n`)    

       
        
        const cognitoResponse = await CognitoService.logout(req.body.email, req.body.token)
        

        //console.log("Cognito Response: " + JSON.stringify(cognitoResponse, null, 2) + "\n")


        if(cognitoResponse.error != null){

            return res.status(400).json({
                statusCode: 400,
                response: {
                    error: {
                        code: cognitoResponse.error.code,
                        message: cognitoResponse.error.message,
                    }
                },
                request: {
                    type: "POST",
                    url: "host/logout",
                    body: {"email": req.body.email}
                }})
        }


      return res.status(200).json({
        statusCode: 200,
        response: {
            message: "User logged out successfully",
        },
        request: {
            type: "POST",
            url: "host/logout",
            body: {email: req.body.email}
        }})

    }

    static async isAuthenticated(req, res, next) { }

}