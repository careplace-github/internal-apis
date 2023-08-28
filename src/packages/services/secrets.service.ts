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
      await asyncAccess('.env.local');
      console.log('File .env.local found.');

      const localEnv = dotenv.config({ path: '.env.local' });

      // set the AWS credentials with the values from .env.local
      if (localEnv.parsed) {
        awsConfig.credentials = new AWS.Credentials({
          accessKeyId: localEnv.parsed.AWS_ACCESS_KEY_ID,
          secretAccessKey: localEnv.parsed.AWS_SECRET_ACCESS_KEY,
        });
      }
    } catch (err) {
      console.log('No .env.local file found.');

      // no need to load the AWS credentials because the app will be deployed as an ECS task and the credentials will be provided by the task role.
    }

    AWS.config.update(awsConfig);

    const ENV = process.env.NODE_ENV || 'development';

    logger.info(`[ENV: ${ENV}] Loading AWS secrets...`);

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
  } catch (error) {}
}
