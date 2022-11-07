import CognitoService from "../services/cognito.service.js"
import companiesDAO from "../db/companiesDAO.js"


export default class UsersController {



static async getCompanies(req, res, next) { 

    const companies = await companiesDAO.getUsers()
       res.status(200).json(companies)
}




}