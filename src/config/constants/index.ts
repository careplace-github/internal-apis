import { JWK, RSA } from 'jwk-to-pem';
import publicKey from './cognito-public-key.json';
import logger from 'src/logs/logger';

// Loads environment settings
export const ENV = process.env.NODE_ENV || ('development' as string);

// Application
export const HOST = process.env.HOST as string;
export const API_VERSION = process.env.API_VERSION as string;
export const AUTH_PROVIDER = process.env.AUTH_PROVIDER as string;

export const API_URL = process.env.API_URL as string;
export const API_ROUTE = process.env.API_ROUTE as string;
export const ADMIN_API_URL = process.env.ADMIN_API_URL as string;
export const ADMIN_API_ROUTE = process.env.ADMIN_API_ROUTE as string;

export const SERVER_PORT = process.env.PORT || (process.env.PORT_BACKUP as string);

export const MARKETPLACE_BASE_URL = process.env.MARKETPLACE_BASE_URL as string;
export const BUSINESS_BASE_URL = process.env.BUSINESS_BASE_URL as string;

// MongoDB credentials
export const MONGODB_USER = process.env.MONGODB_USER as string;
export const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD as string;

// MongoDB Cluster
export const MONGODB_CLUSTER_URI = process.env.MONGODB_CLUSTER_URI as string;

//MongoDB databases
export const MONGODB_DB_ACTIVE_NS = process.env.MONGODB_DB_ACTIVE_NS as string;
export const MONGODB_DB_DELETES_NS = process.env.MONGODB_DB_DELETES_NS as string;
export const MONGODB_DB_ADMIN_NS = process.env.MONGODB_DB_ADMIN_NS as string;

// MongoDB collections
export const MONGODB_COLLECTION_COLLABORATORS_NS = process.env
  .MONGODB_COLLECTION_COLLABORATORS_NS as string;
export const MONGODB_COLLECTION_CUSTOMERS_NS = process.env
  .MONGODB_COLLECTION_CUSTOMERS_NS as string;
export const MONGODB_COLLECTION_HEALTH_UNITS_NS = process.env
  .MONGODB_COLLECTION_HEALTH_UNITS_NS as string;
export const MONGODB_COLLECTION_SERVICES_NS = process.env.MONGODB_COLLECTION_SERVICES_NS as string;
export const MONGODB_COLLECTION_HOME_CARE_ORDERS_NS = process.env
  .MONGODB_COLLECTION_HOME_CARE_ORDERS_NS as string;
export const MONGODB_COLLECTION_FILES_NS = process.env.MONGODB_COLLECTION_FILES_NS as string;
export const MONGODB_COLLECTION_CAREGIVERS_NS = process.env
  .MONGODB_COLLECTION_CAREGIVERS_NS as string;
export const MONGODB_COLLECTION_EVENTS_NS = process.env.MONGODB_COLLECTION_EVENTS_NS as string;
export const MONGODB_COLLECTION_EVENT_SERIES_NS = process.env
  .MONGODB_COLLECTION_EVENT_SERIES_NS as string;
export const MONGODB_COLLECTION_PATIENTS_NS = process.env.MONGODB_COLLECTION_PATIENTS_NS as string;
export const MONGODB_COLLECTION_HEALTH_UNIT_REVIEWS_NS = process.env
  .MONGODB_COLLECTION_HEALTH_UNIT_REVIEWS_NS as string;

// AWS Credentials
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;
export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_USER = process.env.AWS_USER as string;
export const AWS_ARN = process.env.AWS_ARN as string;

// AWS Cognito Credentials
export const AWS_COGNITO_MARKETPLACE_CLIENT_SECRET = process.env
  .AWS_COGNITO_MARKETPLACE_CLIENT_SECRET as string;
export const AWS_COGNITO_BUSINESS_CLIENT_SECRET = process.env
  .AWS_COGNITO_BUSINESS_CLIENT_SECRET as string;
export const AWS_COGNITO_BUSINESS_USER_POOL_ID = process.env
  .AWS_COGNITO_BUSINESS_USER_POOL_ID as string;
export const AWS_COGNITO_ISSUER = process.env.AWS_COGNITO_ISSUER as string;
export const AWS_COGNITO_PUBLIC_KEY = publicKey.keys[1] as RSA; // Access a specific key in the JWK
export const AWS_COGNITO_BUSINESS_CLIENT_ID = process.env.AWS_COGNITO_BUSINESS_CLIENT_ID as string;
export const AWS_COGNITO_MARKETPLACE_USER_POOL_ID = process.env
  .AWS_COGNITO_MARKETPLACE_USER_POOL_ID as string;
export const AWS_COGNITO_MARKETPLACE_CLIENT_ID = process.env
  .AWS_COGNITO_MARKETPLACE_CLIENT_ID as string;
export const AWS_COGNITO_REGION =
  process.env.AWS_COGNITO_REGION || (process.env.AWS_REGION as string);
export const AWS_COGNITO_IDENTITY_POOL_ID = process.env.AWS_COGNITO_IDENTITY_POOL_ID as string;
export const AWS_COGNITO_BUSINESS_GROUPS = process.env.AWS_COGNITO_BUSINESS_ROLES as string;
export const AWS_COGNITO_MARKETPLACE_GROUPS = process.env.AWS_COGNITO_MARKETPLACE_ROLES as string;

export const AWS_COGNITO_ADMIN_CLIENT_SECRET = process.env
  .AWS_COGNITO_ADMIN_CLIENT_SECRET as string;
export const AWS_COGNITO_ADMIN_USER_POOL_ID = process.env.AWS_COGNITO_ADMIN_USER_POOL_ID as string;
export const AWS_COGNITO_ADMIN_CLIENT_ID = process.env.AWS_COGNITO_ADMIN_CLIENT_ID as string;

// AWS S3 Credentials
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME as string;
export const AWS_S3_REGION = process.env.AWS_S3_REGION || (process.env.AWS_REGION as string);

// AWS SES Credentials
export const AWS_SES_REGION = process.env.AWS_SES_REGION || (process.env.AWS_REGION as string);
export const AWS_SES_SENDER_EMAIL = process.env.AWS_SES_SENDER_EMAIL as string;
export const AWS_SES_BUSINESS_SENDER_EMAIL = process.env.AWS_SES_BUSINESS_SENDER_EMAIL as string;
export const AWS_SES_REPLY_TO_EMAIL = process.env.AWS_SES_REPLY_TO_EMAIL as string;
export const AWS_SES_ORDERS_BCC_EMAIL = process.env.AWS_SES_ORDERS_BCC_EMAIL as string;

// Stripe Credentials
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY as string;
export const STRIPE_ACCOUNT_ENDPOINT_SECRET = process.env.STRIPE_ACCOUNT_ENDPOINT_SECRET as string;
export const STRIPE_CONNECT_ENDPOINT_SECRET = process.env.STRIPE_CONNECT_ENDPOINT_SECRET as string;
export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID as string;
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID as string;
export const STRIPE_APPLICATION_FEE = process.env.STRIPE_APPLICATION_FEE as string;

// Vendus Credentials
export const VENDUS_SECRET_KEY = process.env.VENDUS_SECRET_KEY as string;
