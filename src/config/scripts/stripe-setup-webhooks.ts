import { spawn } from 'child_process';
import logger from '@logger';

async function runStripeListen() {
  logger.info('Running stripe listen process');

  const isWindows = process.platform === 'win32';

  let listenCommand;
  let listenArgs;

  if (isWindows) {
    listenCommand = 'cmd.exe';
    listenArgs = ['/c', 'stripe', 'listen', '--forward-to', 'localhost:8080/v1/webhooks/stripe'];
  } else {
    listenCommand = 'stripe';
    listenArgs = ['listen', '--forward-to', 'localhost:8080/v1/webhooks/stripe'];
  }

  const listenChild = spawn(listenCommand, listenArgs);

  listenChild.stdout.on('data', (data) => {
    logger.info(`stripe listen stdout: ${data}`);
  });

  listenChild.stderr.on('data', (data) => {
    logger.info(`stripe listen stderr: ${data}`);
  });

  listenChild.on('close', (code) => {
    logger.info(`stripe listen child process exited with code ${code}`);
  });

  listenChild.on('error', (err) => {
    logger.error(`stripe listen child process error: ${err}`);
  });

  logger.info('Finished running stripe listen process');
}

export default runStripeListen;
