import { execSync } from 'child_process';

import logger from '@logger';

function stopProcessesOnPort(port: number) {
  const stopProcessesCommand =
    process.platform === 'win32'
      ? `netstat -ano | findstr :${port} | findstr /R LISTENING`
      : `lsof -i:${port} -t`;

  try {
    const processes = execSync(stopProcessesCommand, { encoding: 'utf8' }).trim().split('\n');
    processes.forEach((pid) => {
      execSync(process.platform === 'win32' ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`);
    });
  } catch (error) {
    // Handle error if no processes are running on the port
    logger.error(`Failed to stop processes on port ${port}: ${error}`);
  }
}

function startNginx() {
  const startNginxCommand = process.platform === 'win32' ? 'start nginx' : 'nginx';

  try {
    execSync(startNginxCommand);
  } catch (error) {
    // Handle error if Nginx start fails
    logger.error(`Failed to start Nginx: ${error}`);
  }
}

async function setupServerEnvironment(port: number) {
  logger.info(`Cleaning up server on port ${port}`);
  stopProcessesOnPort(port);
  startNginx();
  logger.info(`Finished cleaning up server on port ${port}`);
}

export default setupServerEnvironment;
