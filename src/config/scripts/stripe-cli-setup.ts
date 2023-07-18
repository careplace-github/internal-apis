import { spawn } from 'child_process';
import { EOL } from 'os';
import logger from '@logger';

async function stripeCLILogin(API_KEY: string, DEVICE_NAME: string) {
  const loginCommand = `
    #!/usr/bin/expect -f

    # Set the device name
    set device_name "${DEVICE_NAME}"

    # Run the stripe login command interactively
    spawn stripe login --interactive

    # Expect the prompt for the API key and enter the value
    expect "Enter your API key:"
    send "${API_KEY}\\r"

    # Expect the prompt for the device name and enter the value
    expect "How would you like to identify this device in the Stripe Dashboard?"
    send "${DEVICE_NAME}\\r"

    # Wait for the command to finish
    expect eof
  `;

  logger.info('Running stripe-cli login process');

  const child = spawn('expect', ['-c', loginCommand]);

  child.stdout.on('data', (data) => {
    logger.info(`stripe-cli login process stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    logger.info(`stripe-cli login process stderr: ${data}`);
  });

  child.on('close', (code) => {
    logger.info(`stripe-cli login process exited with code ${code}`);
  });

  child.on('error', (err) => {
    logger.error(`stripe-cli login process error: ${err}`);
    throw err;
  });

  logger.info('Finished running stripe-cli login process');
}

async function stripeCLIListen(API_KEY: string, listen: boolean) {
  try {
    logger.info('Running stripe-cli process');

    const isWindows = process.platform === 'win32';
    let child;

    let listenCommand: string;
    let listenArgs: string[];

    if (isWindows) {
      listenCommand = 'cmd.exe';
      listenArgs = ['/c', 'stripe', 'listen', '--forward-to', 'localhost:8080/v1/webhooks/stripe'];
    } else {
      listenCommand = 'stripe';
      listenArgs = ['listen', '--forward-to', 'localhost:8080/v1/webhooks/stripe'];
    }

    const listenChild = spawn(listenCommand, listenArgs);

    child.stdout.on('data', (data) => {
      logger.info(`stripe-cli process stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      logger.info(`stripe-cli process stderr: ${data}`);
    });

    if (listen) {
      child.stdout.on('data', (data) => {
        // Process stripe-cli listen output if needed
        // ...
      });
    }

    child.stdin.write(API_KEY + EOL);

    if (!listen) {
      child.stdin.write(EOL);
    }

    child.on('close', (code) => {
      logger.info(`stripe-cli process exited with code ${code}`);
    });

    child.on('error', (err) => {
      logger.error(`stripe-cli process error: ${err}`);
      throw err;
    });

    logger.info('Finished running stripe-cli process');
  } catch (error) {
    logger.error(`Failed to run stripe-cli process: ${error}`);
  }
}

async function main() {
  const API_KEY = process.env.STRIPE_SECRET_KEY;
  const DEVICE_NAME = process.env.STRIPE_DEVICE_NAME;

  if (process.env.NODE_ENV !== 'development') {
    logger.info(`This script is used for setting up stripe-cli for local machine webhooks forwarding.
    This functionality is only intended for development environment.
    Skipping stripe-cli commands in non-development environment.
    Please register your webhook URL instead.`);
    return;
  }

  if (!API_KEY) {
    logger.error('Missing Stripe secret key');
    return;
  }

  if (!DEVICE_NAME) {
    logger.error('Missing Stripe device name');
    return;
  }

  await stripeCLILogin(API_KEY, DEVICE_NAME);
  await stripeCLIListen(API_KEY, true);
}

main();
