import AWS from 'aws-sdk';
import { APIVersions } from 'aws-sdk/lib/config';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import dotenv from 'dotenv';

import logger from '@logger';

import fs from 'fs';
import util from 'util';
const asyncAccess = util.promisify(fs.access);

export async function loadAWSSecrets() {
  try {
    // Set up AWS SDK with your preferred configuration
    const awsConfig: AWS.ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions = {
      region: 'eu-west-3',
    };

    try {
      await asyncAccess('.env');
    } catch (error) {
      throw new Error('Missing required .env file.');
    }

    const environment = process.env.NODE_ENV || 'development'; // Get the current environment

    logger.info(`[ENV: ${environment}] Loading AWS secrets...`);

    if (environment === 'development') {
      try {
        await asyncAccess('.env.local');

        const localEnv = dotenv.config({ path: '.env.local' });

        // set the AWS credentials with the values from .env.local
        if (localEnv.parsed) {
          awsConfig.credentials = new AWS.Credentials({
            accessKeyId: localEnv.parsed.AWS_ACCESS_KEY_ID,
            secretAccessKey: localEnv.parsed.AWS_SECRET_ACCESS_KEY,
          });
        }
      } catch (err) {
        throw new Error('Server is in development mode but no .env.local file was found.');
      }
    }

    AWS.config.update(awsConfig);

    const secretsManager = new AWS.SecretsManager();

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
  } catch (error) {}
}
