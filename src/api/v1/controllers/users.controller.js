
import CognitoService from "../services/cognito.service.js"
import usersDAO from "../db/usersDAO.js"


export default class UsersController {

    static async createUser(req, res, next) { 

    const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cognitoId: ""
    }    
        
    const congitoResponse = await CognitoService.createCognitoUser(newUser.email, newUser.password)

    console.log("code " + congitoResponse.statusCode)
      if (congitoResponse.statusCode == 422) {
        return res.status(400).json({
            message: "User already exists",
            request: {
                type: "POST",
                url: "host/signup",
                body: {"name": newUser.name, "email": newUser.email}
            }})
    }

    newUser.cognitoId = congitoResponse.response.cognitoId
    
    const userCreated = await usersDAO.addUser(newUser.cognitoId, newUser.name, newUser.email)

    return res.status(200).json({
        message: "User registered successfully",
        request: {
            type: "POST",
            url: "host/signup",
            body: {"name": userCreated.name, "email": userCreated.email, "verified": false}
        }})
    
}


static async getUsers(req, res, next) { 
}

static async getUserById(req, res, next) { 
}

static async updateUser(req, res, next) { 
}

static async deleteUser(req, res, next) { 
}











}