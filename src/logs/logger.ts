import { createLogger, transports, format } from 'winston';
import httpContext from 'express-http-context';

const customFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    const requestId = httpContext.get('requestId') || 'N/A';
    return `${info.timestamp} | [${info.level
      .toUpperCase()
      .padEnd(7)}] | [Request ID: ${requestId}]: ${info.message}`;
  })
);

const logger = createLogger({
  format: customFormat,
  transports: [
    new transports.Console(),
    new transports.File({
      filename: './src/logs/server.log',
      level: 'debug',
    }),
  ],
});

export default logger;
