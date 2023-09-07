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

    // Get the current environment, this is set in the package.json file. The default is development
    const environment = process.env.ENV || 'development';

    logger.info(`[ENV: ${environment}] Loading AWS secrets...`);

    try {
      // Check if .env.local file exists
      await asyncAccess('.env.local');

      // If the file exists use the credentials from the .env.local file, otherwise it will use the ECS task role credentials by default

      // Load the .env.local file with the developer credentials
      const localEnv = dotenv.config({ path: '.env.local' });

      if (localEnv.parsed) {
        // set the AWS credentials with the values from .env.local

        awsConfig.credentials = new AWS.Credentials({
          accessKeyId: localEnv.parsed.AWS_ACCESS_KEY_ID,
          secretAccessKey: localEnv.parsed.AWS_SECRET_ACCESS_KEY,
        });
      }
    } catch (err) {
      console.log(`Failed to load .env.local file.`, err);
      if (environment === 'development') {
        // If the environment is development and the .env.local file does not exist, throw an error
        throw new Error('Server is in development mode but no .env.local file was found.');
      }
      // If the environment is not development, then the .env.local file is not required
      // If one wants to use the NODE_ENV=staging in development, then the .env.local file is required
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
  } catch (error) {
    console.error(`Failed to retrieve AWS secrets.`, error);
  }
}
