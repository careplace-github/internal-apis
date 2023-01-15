import dotenv from "dotenv";

// Loads environment settings
dotenv.config({ path: "./src/config/.env/.env" });

export const env = process.env.NODE_ENV;

// Loads environment variables
dotenv.config({ path: `./src/config/.env/.env.${env}` });

// Application
export const host = process.env.HOST;
export const api_version = process.env.API_VERSION;
export const api_url = process.env.API_URL;
export const SERVER_Port = process.env.PORT || process.env.PORT_BACKUP;

// MongoDB credentials
export const MONGODB_user = process.env.MONGODB_USER;
export const MONGODB_password = process.env.MONGODB_PASSWORD;

// MongoDB Cluster
export const MONGODB_cluster_uri = process.env.MONGODB_CLUSTER_URI;

//MongoDB databases
export const MONGODB_db_active = process.env.MONGODB_DB_ACTIVE;
export const MONGODB_db_deletes = process.env.MONGODB_DB_DELETES;

// MongoDB connection
export const MONGODB_db_active_uri = `mongodb+srv://${MONGODB_user}:${MONGODB_password}@${MONGODB_cluster_uri}/${MONGODB_db_active}?retryWrites=true&w=majority`;
export const MONGODB_db_deletes_uri = `mongodb+srv://${MONGODB_user}:${MONGODB_password}@${MONGODB_cluster_uri}/${MONGODB_db_deletes}?retryWrites=true&w=majority`;

// MongoDB collections
export const MONGODB_collection_users = process.env.MONGODB_COLLECTION_USERS_NS;
export const MONGODB_collection_companies =
  process.env.MONGODB_COLLECTION_COMPANIES_NS;
export const MONGODB_collection_services =
  process.env.MONGODB_COLLECTION_SERVICES_NS;
export const MONGODB_collection_orders =
  process.env.MONGODB_COLLECTION_ORDERS_NS;

export const MONGODB_collection_files = process.env.MONGODB_COLLECTION_FILES_NS;
export const MONGODB_collection_caregivers =
  process.env.MONGODB_COLLECTION_CAREGIVERS_NS;
export const MONGODB_collection_events =
  process.env.MONGODB_COLLECTION_EVENTS_NS;
export const MONGODB_collection_eventsSeries =
  process.env.MONGODB_COLLECTION_EVENTS_SERIES_NS;

// AWS Credentials
export const AWS_access_key_id = process.env.AWS_ACCESS_KEY_ID;
export const AWS_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_region = process.env.AWS_REGION;
export const AWS_user = process.env.AWS_USER;
export const AWS_ARN = process.env.AWS_ARN;

// AWS Cognito Credentials
export const AWS_cognito_crm_user_pool_id =
  process.env.AWS_COGNITO_CRM_USER_POOL_ID;
export const AWS_cognito_crm_client_id = process.env.AWS_COGNITO_CRM_CLIENT_ID;
export const AWS_cognito_marketplace_user_pool_id =
  process.env.AWS_COGNITO_MARKETPLACE_USER_POOL_ID;
export const AWS_cognito_marketplace_client_id =
  process.env.AWS_COGNITO_MARKETPLACE_CLIENT_ID;
export const AWS_cognito_region =
  process.env.AWS_COGNITO_REGION || process.env.AWS_REGION;
export const AWS_cognito_identity_pool_id =
  process.env.AWS_COGNITO_IDENTITY_POOL_ID;

// AWS S3 Credentials
export const AWS_s3_bucket_name = process.env.AWS_S3_BUCKET_NAME;
export const AWS_s3_region =
  process.env.AWS_S3_REGION || process.env.AWS_REGION;

// AWS SES Credentials
export const AWS_ses_region =
  process.env.AWS_SES_REGION || process.env.AWS_REGION;
export const AWS_ses_sender_email = process.env.AWS_SES_SENDER_EMAIL;
export const AWS_ses_reply_to_email = process.env.AWS_SES_REPLY_TO_EMAIL;
export const AWS_ses_starttls_port =
  process.env.AWS_SES_STARTTLS_PORT || AWS_SES_STARTTLS_PORT_BACKUP;
export const AWS_ses_tls_wrapper_port =
  process.env.AWS_SES_TLS_WRAPPER_PORT || AWS_SES_TLS_WRAPPER_PORT_BACKUP;

// Stripe Credentials
export const STRIPE_secret_key = process.env.STRIPE_SECRET_KEY;
export const STRIPE_publishable_key = process.env.STRIPE_PUBLISHABLE_KEY;
