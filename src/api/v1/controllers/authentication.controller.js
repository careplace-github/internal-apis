
import CognitoService from "../services/cognito.service.js"


export default class AuthenticationController {


    static async isAuthenticated(req, res, next) { }

    static async login (req, res, next) { 
        const {email, password} = req.body
        const cognitoResponse = await CognitoService.signIn(email, password)
        if (cognitoResponse.statusCode == 401) {
            return res.status(401).json({
                message: "Invalid credentials",
                request: {
                    type: "POST",
                    url: "host/signin",
                    body: {"email": email, "password": password}
                }
            })
        }
        return res.status(200).json({
            message: "User logged in successfully",
            request: {
                type: "POST",
                url: "host/signin",
                
            }
        })
    }

}