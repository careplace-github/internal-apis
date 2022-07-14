import {cognitoUserPool} from "amazon-cognito-identity-js"
import { AWS_client_id, AWS_pool_id } from "../../../config/constants"


// 
const poolData = {
    UserPoolId: AWS_pool_id,
    ClientId: AWS_client_id
}

const cognitoUserPool = new cognitoUserPool(poolData)



export default class AuthenticationService {

static async getSession () {
    try {
        const session = await cognitoUserPool.getCurrentUser()
        if (session) {
            return session
        }
    } catch (e) {
        console.error(`Unable to get session: ${e}`)
        return {error: e}
    }
}

static async getCognitoUser(email) {}

static async login(email, password) {}


static async createCognitoUser(email, password) {
    try { 
        let cognitoUserId 
        const userPool = new cognitoUserPool(poolData)
        const userAttributes = [
            {
                Email: email,
                Password: password,
}       ]
   

} catch (e) {}
    return cognitoUserId
}

}