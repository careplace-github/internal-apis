import CognitoService from "../services/cognito.service.js"
import usersDAO from "../db/usersDAO.js"


export default class UsersController {



static async getUsers(req, res, next) { 

    const users = await usersDAO.getUsers()
       res.status(200).json(response)
}

static async getUserById(req, res, next) { 
}

static async updateUser(req, res, next) { 
}

static async deleteUser(req, res, next) { 
}


}