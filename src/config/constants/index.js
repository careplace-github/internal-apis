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

// MongoDB credentials
export const DB_user = process.env.DB_USER
export const DB_password = process.env.DB_PASSWORD

// MongoDB connection 
export const DB_uri = `mongodb+srv://${DB_user}:${DB_password}@development-node.0f8rxwj.mongodb.net/?retryWrites=true&w=majority`

//MongoDB database name
export const DB_name = process.env.DB_NAME

// MongoDB collections name
export const COLLECTION_users_ns = process.env.COLLECTION_USERS_NS
export const COLLECTION_companies_ns = process.env.COLLECTION_COMPANIES_NS


export const JWT_secret = process.env.JWT_SECRET


// AWS credentials
export const AWS_user_pool_id = process.env.AWS_COGNITO_USER_POOL_ID
export const AWS_client_id = process.env.AWS_COGNITO_CLIENT_ID
export const AWS_region = process.env.AWS_COGNITO_REGION
export const AWS_identity_pool_id = process.env.AWS_COGNITO_IDENTITY_POOL_ID
export const AWS_access_key_id = process.env.AWS_ACCESS_KEY_ID
export const AWS_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY





