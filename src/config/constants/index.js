import dotenv from "dotenv"
import CognitoUserPool from "amazon-cognito-identity-js"

// Loads environment settings
dotenv.config({path: './src/config/.env/.env'}) 

export const env = process.env.NODE_ENV
export const api_version = process.env.API_VERSION
export const api = process.env.API_URL
export const api_url = api.concat(process.env.API_VERSION)

// Application
export const APP_url = process.env.APP_URL


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


// AWS Credentials
export const AWS_access_key_id = process.env.AWS_ACCESS_KEY_ID
export const AWS_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY
export const AWS_region = process.env.AWS_REGION
export const AWS_user = process.env.AWS_USER
export const AWS_ARN = process.env.AWS_ARN



// AWS Cognito Credentials
export const AWS_cognito_crm_user_pool_id = process.env.AWS_COGNITO_CRM_USER_POOL_ID
export const AWS_cognito_crm_client_id = process.env.AWS_COGNITO_CRM_CLIENT_ID
export const AWS_cognito_marketplace_user_pool_id = process.env.AWS_COGNITO_MARKETPLACE_USER_POOL_ID
export const AWS_cognito_marketplace_client_id = process.env.AWS_COGNITO_MARKETPLACE_CLIENT_ID
export const AWS_cognito_region = process.env.AWS_COGNITO_REGION || process.env.AWS_REGION
export const AWS_cognito_identity_pool_id = process.env.AWS_COGNITO_IDENTITY_POOL_ID


// AWS S3 Credentials
export const AWS_s3_bucket_name = process.env.AWS_S3_BUCKET_NAME
export const AWS_s3_region = process.env.AWS_S3_REGION || process.env.AWS_REGION



// AWS SES Credentials
export const AWS_ses_region = process.env.AWS_SES_REGION || process.env.AWS_REGION
export const AWS_ses_sender_email = process.env.AWS_SES_SENDER_EMAIL
export const AWS_ses_sender_name = process.env.AWS_SES_SENDER_NAME
export const AWS_ses_reply_to_email = process.env.AWS_SES_REPLY_TO_EMAIL
export const AWS_ses_reply_to_name = process.env.AWS_SES_REPLY_TO_NAME
export const AWS_ses_starttls_port = process.env.AWS_SES_STARTTLS_PORT || AWS_SES_STARTTLS_PORT_BACKUP
export const AWS_ses_tls_wrapper_port = process.env.AWS_SES_TLS_WRAPPER_PORT || AWS_SES_TLS_WRAPPER_PORT_BACKUP








