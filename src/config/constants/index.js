import dotenv from "dotenv"
import CognitoUserPool from "amazon-cognito-identity-js"

// Loads environment settings
dotenv.config({path: './src/config/.env/.env'}) 

export const env = process.env.NODE_ENV
export const api_version = process.env.API_VERSION
export const api = process.env.API_URL
export const api_url = api.concat(process.env.API_VERSION)


// Loads environment variables
dotenv.config({path: `./src/config/.env/.env.${env}`}) 

export const SERVER_Port = process.env.PORT || process.env.PORT_BACKUP
export const DB_user = process.env.DB_USER
export const DB_password = process.env.DB_PASSWORD
export const DB_users_ns = process.env.DB_USERS_NS
export const DB_users_uri = `mongodb+srv://${DB_user}:${DB_password}@development-node.0f8rxwj.mongodb.net/?retryWrites=true&w=majority`
export const JWT_secret = process.env.JWT_SECRET

export const AWS_user_pool_id = process.env.AWS_COGNITO_USER_POOL_ID
export const AWS_client_id = process.env.AWS_COGNITO_CLIENT_ID
export const AWS_region = process.env.AWS_COGNITO_REGION
export const AWS_identity_pool_id = process.env.AWS_COGNITO_IDENTITY_POOL_ID




