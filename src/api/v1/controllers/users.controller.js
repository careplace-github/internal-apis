import CognitoService from "../services/cognito.service.js"
import usersDAO from "../db/usersDAO.js"
import companiesDAO from "../db/companiesDAO.js"


export default class UsersController {

static async createUser(req, res, next) {
    try {
        const { email, name, phoneNumber, country, city, address, zipCode, companyId, role, photoURL} = req.body

        // generate a random password of 10 characters
        const password = Math.random().toString(36).slice(-10)

        const cognitoUser = await CognitoService.signUp(email, password)

        
   
        const newUser = await usersDAO.addUser(cognitoUser.userSub , email, name, phoneNumber, country, city, address, zipCode, companyId, role)

        res.status(201).json(newUser)

    } catch (error) {
        next(error)
    }
}


static async getUsers(req, res, next) { 

    const users = await usersDAO.getUsers()
       res.status(200).json(users)
}

// Get's the user by the email from the request

static async getAccount(req, res, next) {



    const user = await usersDAO.getUserByEmail(req.body.userEmail)
    const company = await companiesDAO.getCompanyByUserId(user._id)

    user.company = company


    res.status(200).json(user)
 }

static async updateUser(req, res, next) { 
}

static async deleteUser(req, res, next) { 
}


}