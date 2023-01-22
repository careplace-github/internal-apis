/**
 * @see https://www.npmjs.com/package/dotenv
 */
import dotenv from "dotenv";

// Loads environment settings
dotenv.config({ path: "./src/config/.env/.env" });

export const ENV = process.env.NODE_ENV;

// Loads environment variables
dotenv.config({ path: `./src/config/.env/.env.${ENV}` });

// Application
export const HOST = process.env.HOST;
export const API_VERSION = process.env.API_VERSION;
export const AUTH_PROVIDER = process.env.AUTH_PROVIDER;


export const API_URL = process.env.API_URL;
export const API_ROUTE = process.env.API_ROUTE;


export const SERVER_PORT = process.env.PORT || process.env.PORT_BACKUP;

// MongoDB credentials
export const MONGODB_USER = process.env.MONGODB_USER;
export const MONGODB_PASSWROD = process.env.MONGODB_PASSWORD;

// MongoDB Cluster
export const MONGODB_CLUSTER_URI = process.env.MONGODB_CLUSTER_URI;

//MongoDB databases
export const MONGODB_DB_ACTIVE_NS = process.env.MONGODB_DB_ACTIVE;
export const MONGODB_DB_DELETES_NS = process.env.MONGODB_DB_DELETES;
export const MONGODB_DB_ADMIN_NS = process.env.MONGODB_DB_ADMIN_NS;

// MongoDB connection
export const MONGODB_DB_ACTIVE_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWROD}@${MONGODB_CLUSTER_URI}/${MONGODB_DB_ACTIVE_NS}?retryWrites=true&w=majority`;
export const MONGODB_DB_DELETES_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWROD}@${MONGODB_CLUSTER_URI}/${MONGODB_DB_DELETES_NS}?retryWrites=true&w=majority`;

// MongoDB collections
export const MONGODB_COLLECTION_CRM_USERS_NS = process.env.MONGODB_COLLECTION_CRM_USERS_NS;
export const MONGODB_COLLECTION_MARKETPLACE_USERS_NS = process.env.MONGODB_COLLECTION_MARKETPLACE_USERS_NS;
export const MONGODB_COLLECTION_COMPANIES_NS = process.env.MONGODB_COLLECTION_COMPANIES_NS;
export const MONGODB_COLLECTION_SERVICES_NS = process.env.MONGODB_COLLECTION_SERVICES_NS;
export const MONGODB_COLLECTION_ORDERS_NS = process.env.MONGODB_COLLECTION_ORDERS_NS;
export const MONGODB_COLLECTION_FILES_NS = process.env.MONGODB_COLLECTION_FILES_NS;
export const MONGODB_COLLECTION_CAREGIVERS_NS = process.env.MONGODB_COLLECTION_CAREGIVERS_NS;
export const MONGODB_COLLECTION_EVENTS_NS = process.env.MONGODB_COLLECTION_EVENTS_NS;
export const MONGODB_COLLECTION_EVENTS_SERIES_NS = process.env.MONGODB_COLLECTION_EVENTS_SERIES_NS;
export const MONGODB_COLLECTION_RELATIVES_NS = process.env.MONGODB_COLLECTION_RELATIVES_NS;


// AWS Credentials
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_USER = process.env.AWS_USER;
export const AWS_ARN = process.env.AWS_ARN;

// AWS Cognito Credentials
export const AWS_COGNITO_CRM_USER_POOL_ID = process.env.AWS_COGNITO_CRM_USER_POOL_ID;
export const AWS_COGNITO_CRM_CLIENT_ID = process.env.AWS_COGNITO_CRM_CLIENT_ID;
export const AWS_COGNITO_MARKETPLACE_USER_POOL_ID = process.env.AWS_COGNITO_MARKETPLACE_USER_POOL_ID;
export const AWS_COGNITO_MARKETPLACE_CLIENT_ID = process.env.AWS_COGNITO_MARKETPLACE_CLIENT_ID;
export const AWS_COGNITO_REGION = process.env.AWS_COGNITO_REGION || process.env.AWS_REGION;
export const AWS_COGNITO_IDENTITY_POOL_ID = process.env.AWS_COGNITO_IDENTITY_POOL_ID;
export const AWS_COGNITO_CRM_GROUPS = process.env.AWS_COGNITO_CRM_ROLES;
export const AWS_COGNITO_MARKETPLACE_GROUPS = process.env.AWS_COGNITO_MARKETPLACE_ROLES;

// AWS S3 Credentials
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
export const AWS_S3_REGION = process.env.AWS_S3_REGION || process.env.AWS_REGION;

// AWS SES Credentials
export const AWS_SES_REGION = process.env.AWS_SES_REGION || process.env.AWS_REGION;
export const AWS_SES_SENDER_EMAIL = process.env.AWS_SES_SENDER_EMAIL;
export const AWS_SES_REPLY_TO_EMAIL = process.env.AWS_SES_REPLY_TO_EMAIL;
export const AWS_SES_ORDERS_BCC_EMAIL = process.env.AWS_SES_ORDERS_BCC_EMAIL;

// Stripe Credentials
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
export const STRIPE_ACCOUNT_ENDPOINT_SECRET = process.env.STRIPE_ACCOUNT_ENDPOINT_SECRET;
export const STRIPE_CONNECT_ENDPOINT_SECRET = process.env.STRIPE_CONNECT_ENDPOINT_SECRET;
export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
export const STRIPE_APPLICATION_FEE = process.env.STRIPE_APPLICATION_FEE;
