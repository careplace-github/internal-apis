import { spawn } from 'child_process';
import { EOL } from 'os';
import logger from '@logger';

const DEVICE_NAME = 'Careplace Development Backend';

function getExpectScript(API_KEY: string) {
  return `
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
}

async function runStripeLogin(API_KEY: string) {
  logger.info('Running stripe-cli login process');

  if (process.env.NODE_ENV !== 'development') {
    logger.info(`This script is used for setting up stripe-cli for local machine webhooks forwarding.
    This functionality is only intended for development environment.
    Skipping stripe-cli login in non-development environment.
    Please register your webhook URL instead.`);
    return;
  }

  const isWindows = process.platform === 'win32';
  let child;

  if (isWindows) {
    child = spawn('stripe', ['login', '--interactive'], { shell: true });
  } else {
    child = spawn('expect', ['-c', getExpectScript(API_KEY)]);
  }

  child.stdout.on('data', (data) => {
    logger.info(`stripe-cli-login stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    logger.error(`stripe-cli-login stderr: ${data}`);
  });

  child.stdin.write(API_KEY + EOL);
  child.stdin.write(DEVICE_NAME + EOL);

  child.on('close', (code) => {
    logger.info(`stripe-cli-login child process exited with code ${code}`);
  });

  child.on('error', (err) => {
    logger.error(`stripe-cli-login child process error: ${err}`);
  });

  logger.info('Finished running stripe-cli login process');
}

// Call the function to run the stripe login process
export default runStripeLogin;
