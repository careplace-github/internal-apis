import { info } from "console";
import { createLogger, transports, format } from "winston";

const customFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    return `${info.timestamp} | [${info.level.toUpperCase().padEnd(7)}]: ${info.message}`;
  })
);

const logger = createLogger({
  format: customFormat,
  transports: [
    new transports.Console(),
    new transports.File({
      filename: "./src/logs/server.log",
      level: "info",
    }),
  ],
});

// Export the logger
export default logger;
