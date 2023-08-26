import { createLogger, transports, format } from 'winston';
import httpContext from 'express-http-context';

const { combine, timestamp, printf, colorize } = format;

// Define custom log color options
const logColors = {
  info: 'green',
  warn: 'yellow',
  error: 'red',
  debug: 'blue',
};

const customFormat = combine(
  colorize({ all: true }),
  timestamp(),
  printf((info) => {
    const requestId = httpContext.get('requestId') || 'N/A';
    return `${info.timestamp} | [${info.level
      .toUpperCase()
      .padEnd(7)}] | [Request ID: ${requestId}]: ${info.message}`;
  })
);

const loggerTransports = [
  new transports.Console({
    format: customFormat,
  }),
  ...(process.env.NODE_ENV === 'development' || true
    ? [
        new transports.File({
          filename: './src/logs/server.log',
          level: 'debug',
        }),
      ]
    : []),
];

const logger = createLogger({
  format: customFormat,
  transports: loggerTransports,
});

// Set color options for each log level
Object.keys(logColors).forEach((level) => {
  transports.Console.prototype[level] = function (message: string) {
    const colorizedLevel = `\x1b[3${logColors[level]}m${level.toUpperCase()}\x1b[0m`;
    const logEntry = `[${colorizedLevel}] ${message}`;
    this._write(logEntry); // Use _write method instead of console.log
    return this;
  };
});

export default logger;
