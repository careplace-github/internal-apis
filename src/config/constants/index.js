import dotenv from "dotenv"

// Loads environment settings
dotenv.config({path: './src/config/.env/.env'}) 

export const env = process.env.NODE_ENV
export const api_version = process.env.API_VERSION
export const api = process.env.API_URL
export const api_url = api.concat(process.env.API_VERSION)


// Loads environment variables
dotenv.config({path: `./src/config/.env/.env.${env}`}) 

export const DB_port = process.env.DB_PORT || process.env.DB_PORT_BACKUP
export const DB_user = process.env.DB_USER
export const DB_password = process.env.DB_PASSWORD
export const DB_users_ns = process.env.DB_CRM_USERS_NS
export const DB_users_uri = `mongodb+srv://${DB_user}:${DB_password}@crm-cluster.gptj1ti.mongodb.net/${DB_users_ns}?retryWrites=true&w=majorit`
export const DB_orders_ns = process.env.DB_CRM_USERS_NS
export const DB_orders_uri = `mongodb+srv://${DB_user}:${DB_password}@crm-cluster.gptj1ti.mongodb.net/${DB_orders_ns}?retryWrites=true&w=majorit`
export const JWT_secret = process.env.JWT_SECRET