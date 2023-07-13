import AWS from 'aws-sdk';
import { APIVersions } from 'aws-sdk/lib/config';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import dotenv from 'dotenv';

import logger from '@logger';

export async function loadAWSSecrets() {
  try {
    logger.info('Loading AWS secrets...');

    // Set up AWS SDK with your preferred configuration
    const awsConfig: AWS.ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions = {
      region: 'eu-west-3',
    };

    const ENV = process.env.NODE_ENV || 'development';

    /**
     * If the environment is development load AWS accessKeyId and secretAccessKey from .env.local
     * If the environment is different from development there is no need to load the AWS credentials
     * because the app will be deployed as an ECS task and the credentials will be provided by the
     * task role.
     */
    if (ENV === 'development') {
      // Load accessKeyId and secretAccessKey from .local.env
      const localEnv = dotenv.config({ path: `src/config/.env/.env.local` });

      if (localEnv.parsed) {
        awsConfig.credentials = new AWS.Credentials({
          accessKeyId: localEnv.parsed.AWS_ACCESS_KEY_ID,
          secretAccessKey: localEnv.parsed.AWS_SECRET_ACCESS_KEY,
        });
      } else {
        throw new Error('Failed to load AWS credentials from .env.local');
      }
    }

    AWS.config.update(awsConfig);

    const secretsManager = new AWS.SecretsManager();
    const environment = process.env.NODE_ENV || 'development'; // Get the current environment

    // Define the secret name based on the environment
    let secretName: string;

    if (environment === 'production') {
      secretName = 'prod/env';
    } else if (environment === 'staging') {
      secretName = 'stag/env';
    }
    // Development environment is the default
    else {
      secretName = 'dev/env';
    }

    // Retrieve the secret value from AWS Secrets Manager
    const secretData = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

    if (secretData && secretData.SecretString) {
      // Parse the secret value as JSON or any other appropriate format
      const secrets = JSON.parse(secretData.SecretString);

      // Set the secrets as environment variables
      for (const key in secrets) {
        if (Object.hasOwnProperty.call(secrets, key)) {
          process.env[key] = secrets[key];
        }
      }

      logger.info(`AWS secrets loaded successfully. \n`);
    } else {
      console.error(`Failed to retrieve AWS ${environment} secrets.`);
    }
  } catch (error) {
    console.error('Error loading AWS secrets:', error);
  }
}
