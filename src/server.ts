// body-parser
import bodyParser from 'body-parser';
// cors
import cors from 'cors';
// express
import express, { Request, Response, NextFunction } from 'express';
// express-mongo-sanitize
import mongoSanitize from 'express-mongo-sanitize';
// express-rate-limit
import rateLimit from 'express-rate-limit';
// helmet
import helmet from 'helmet';
// hpp
import hpp from 'hpp';
// mongoose
import mongoose from 'mongoose';
// xss-clean
import xss from 'xss-clean';
// express-http-context
import httpContext from 'express-http-context';
// express-sanitizer
import expressSanitizer from 'express-sanitizer';

// config
import {
  ENV,
  HOST,
  API_VERSION,
  API_ROUTE,
  API_URL,
  SERVER_PORT,
  MONGODB_DB_ACTIVE_URI,
  MONGODB_DB_DELETES_URI,
  MONGODB_DB_ACTIVE_NS,
  MONGODB_DB_DELETES_NS,
} from './config/constants';
// documentation
import swaggerDocs from './documentation/swagger';
// logger
import logger from './logs/logger';

// helpers
import { getServices } from '@api/v1/helpers';
// middlewares
import {
  RequestHandlerMiddleware,
  ResponseHandlerMiddleware,
  ErrorHandlerMiddleware,
} from '@api/v1/middlewares';
// routes
import {
  ConfigRoute,
  FilesRoute,
  AuthRoute,
  CustomersRoute,
  HealthUnitsRoute,
  CollaboratorsRoute,
  ServicesRoute,
  OrdersRoute,
  CalendarRoute,
  WebHooksRoute,
  PatientsRoute,
  PaymentsRoute,
  ReviewsRoute,
  NotificationsRoute,
} from '@api/v1/routes';
// utils
import { HTTPError } from 'src/utils';
import { body } from 'express-validator';

const main = async () => {
  let app: express.Application = express();
  const MAX_RECONNECT_ATTEMPTS = 10;
  let currentReconnectAttempts = 0;

  try {
    logger.info(`
     // -------------------------------------------------------------------------------------------- //
     //                                                                                              //
     //                                      CAREPLACE REST API                                      //
     //                                                                                              //
     // -------------------------------------------------------------------------------------------- //
     \n`);

    logger.info(`Server settings: `);
    logger.info(`Running in '${ENV}' environment`);
    logger.info(`Host: ${HOST} `);
    logger.info(`API Version: ${API_VERSION} `);
    logger.info(`API Route: ${API_ROUTE} `);
    logger.info(`API URL: ${API_URL} `);
    logger.info(`Server Port: ${SERVER_PORT} \n \n`);

    logger.info(`Initializing the server... \n \n`);

    // -------------------------------------------------------------------------------------------- //
    //                        APPLY DATABASE CONNECTION AND ERROR HANDLING                          //
    //                                                                                              //
    //                                                                                              //
    //  @see                                                                                        //
    // -------------------------------------------------------------------------------------------- //

    // MongoDB connection options
    const options: mongoose.ConnectOptions = {
      //useCreateIndex: true, //
      autoIndex: false, // Don't build indexes
      //useFindAndModify: false, // Use the new Server Discover and Monitoring engine
      maxPoolSize: 100, // Maintain up to 100 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    logger.info(`Connecting to MongoDB Database '${MONGODB_DB_ACTIVE_NS}'...`);

    mongoose.set('strictQuery', true);

    // Attempts to create a connection to the MongoDB Database and handles the error of the connection fails
    let db_connection = await mongoose.connect(MONGODB_DB_ACTIVE_URI, options);

    /**
     *  Handle connection errors
     */
    const handleMongoDBError = async (err: Error) => {
      logger.warn(`MongoDB Connection Error: ${err}`);
      currentReconnectAttempts++;
      if (currentReconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        logger.info(`Attempting to reconnect to MongoDB (Attempt ${currentReconnectAttempts})...`);
        try {
          await mongoose.disconnect();
          db_connection = await mongoose.connect(MONGODB_DB_ACTIVE_URI, options);
          currentReconnectAttempts = 0;
        } catch (error) {
          logger.error(`Failed to reconnect to MongoDB: ${error}`);
          if (currentReconnectAttempts === MAX_RECONNECT_ATTEMPTS) {
            logger.error(`Maximum reconnection attempts reached. Exiting the server...`);
            process.exit(1);
          }
        }
      } else {
        logger.error(`Maximum reconnection attempts reached. Exiting the server...`);
        process.exit(1);
      }
    };

    db_connection.connection.on('error', handleMongoDBError);

    db_connection.connection.on('reconnected', () => {
      logger.warn(`MongoDB Connection Reconnected`);
    });

    db_connection.connection.on('disconnected', handleMongoDBError);

    db_connection.connection.on('timeout', handleMongoDBError);

    db_connection.connection.on('close', handleMongoDBError);

    // Successfuly connected to MongoDB
    logger.info(`Connected to MongoDB Database '${MONGODB_DB_ACTIVE_NS}' Successfully!`);
    //Store the connection in a global variable
    global.db = db_connection.connection;

    try {
      // -------------------------------------------------------------------------------------------- //
      //                                INITIALIZE EXPRESS APPLICATION                                //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //

      logger.info(`Initializing Express Application...`);

      // Initialize Express Application
      app = express();

      logger.info(`Express Application Initialized Successfully!`);

      // -------------------------------------------------------------------------------------------- //
      //         APPLY APPLICATION SECURITY MIDDLEWARES AND ATTACKS PROTECTION & HANDLING             //
      //                                                                                              //
      //                                                                                              //
      //  @see https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html        //
      //  @see https://nodejs.org/en/docs/guides/security                                             //
      // -------------------------------------------------------------------------------------------- //

      logger.info(`Applying Application Security Middlewares...`);

      //app.use('/api/v1/webhooks/stripe/connect', bodyParser.raw({type: "*/*"}))

      /**
       * Prevents HTTP Parameter Pollution & Prototype Pollution Attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#prototype-pollution-attacks-cwe-1321
       */
      app.use(hpp());
      app.use(helmet());

      app.use(mongoSanitize());

      /**
       * Prevents Cross-Site Scripting (XSS) attacks
       */
      app.use(xss());
      app.use(helmet.xssFilter());

      /**
       * Prevents MIME Type Sniffing
       */
      app.use(helmet.noSniff());

      /**
       * Prevents Cross-Origin Resource Sharing (CORS) attacks
       */
      app.use(cors());

      app.use(
        body()
          // Trim all request body inputs (eg: name: '  John  ' => name: 'John')
          .trim()
          // Escape all request body inputs (eg: name: '<script>John</script>' => name: '&lt;script&gt;John&lt;/script&gt;')
          .escape()
          // Apply additional custom sanitization logic here if needed
          .customSanitizer((value) => {
            // If the value is an array
            if (Array.isArray(value)) {
              // trim and escape all of its elements
              value = value.map((element) => {
                return element.trim().escape();
              });

              // delete unwanted elements
              delete value.__v;
              delete value._id;
              delete value.createdAt;
              delete value.updatedAt;
            }

            // If the value is an object
            else if (typeof value === 'object') {
              //  trim and escape all of its properties
              for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                  value[key] = value[key].trim().escape();
                }
              }

              // delete unwanted properties
              delete value._id;
              delete value.__v;
              delete value._id;
              delete value.createdAt;
              delete value.updatedAt;
            }

            // If the value is a string
            else if (typeof value === 'string') {
              // TODO escape string
              // trim and escape it
              value = value.trim();
            }

            return value;
          })
      );

      /**
       * Prevents Denial of Service (DoS) attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#denial-of-service-of-http-server-cwe-400
       */

      app.use(
        express.urlencoded({
          // Limits the size of the JSON payload to 5MB

          limit: '5mb',

          // Parses the URL-encoded data with the querystring library (when false) or the qs library (when true)
          extended: true,
        })
      );

      /**
       * Prevents Brute Force Attackss
       */
      app.use(
        rateLimit({
          windowMs: 10 * 60 * 1000, // 10 minutes
          max: 500, // limit each IP to 500 requests per windowMs --> 500 requests per 10 minutes
        })
      );

      /**
       * Prevents Monkey Patching Attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#monkey-patching-cwe-349
       */

      app.use(helmet.hidePoweredBy());

      /**
       * Prevents Memory Access Violation
       *
       * @see https://nodejs.org/en/docs/guides/security/#memory-access-violation-cwe-284
       * @NotWorking
       */
      /**
      * app.use(helmet.noCache());
      * /

      /**
       * Prevents Malicious Third Party Modules
       *
       * @see https://nodejs.org/en/docs/guides/security/#malicious-third-party-modules-cwe-1357
       */
      app.use(
        helmet.contentSecurityPolicy({
          // Defines the Content-Security-Policy HTTP header
          directives: {
            defaultSrc: ["'self'"],

            // Defines valid sources of JavaScript
            scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com/ajax/libs/Chart/2.9.3/Chart.min'],
          },
        })
      );

      /**
       * Prevents HTTP Request Smuggling Attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#http-request-smuggling-cwe-444
       */
      app.use(
        helmet.hsts({
          maxAge: 31536000, // 1 year in seconds
          includeSubDomains: true, // Must be enabled to be approved by Google
          preload: true, // Must be enabled to be approved by Google
        })
      );

      /**
       * Prevents DNS Rebinding Attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#dns-rebinding-cwe-346
       */
      app.use(
        helmet.dnsPrefetchControl({
          allow: false,
        })
      );

      // Remove all keys containing prohibited characters
      app.use(mongoSanitize());

      /**
       * Prevents Improper Certificate Validation Attacks
       *
       * @todo Debug
       * @see https://github.com/nodejs/node/blob/main/SECURITY.md#improper-certificate-validation-cwe-295
       */
      app.use(
        helmet.expectCt({
          maxAge: 30, // 30 days in seconds
          enforce: true,
          reportUri: 'https://example.com',
        })
      );

      /**
       * Prevents Inconsistent Interpretation of HTTP Requests Attacks
       *
       * @see https://github.com/nodejs/node/blob/main/SECURITY.md#inconsistent-interpretation-of-http-requests-cwe-444
       */
      app.use(
        helmet.referrerPolicy({
          policy: 'same-origin',
        })
      );

      /**
       * Prevents Missing Cryptographic Step Attacks
       *
       * @see https://github.com/nodejs/node/blob/main/SECURITY.md#missing-cryptographic-step-cwe-325
       * @NotWorking
       */

      /**
       * app.use(
        helmet.featurePolicy({
          features: {
            syncXhr: ["'none'"], // Prevents Cross-Site Request Forgery (CSRF) attacks
          },
        })
      );
       */

      /**
       * Prevents External Control of System or Configuration Setting Attacks
       *
       * @see https://github.com/nodejs/node/blob/main/SECURITY.md#external-control-of-system-or-configuration-setting-cwe-15
       */

      app.use(
        helmet.permittedCrossDomainPolicies({
          permittedPolicies: 'none',
        })
      );

      /**
       * Prevents Insecure Deserialization Attacks
       *
       * @see
       */
      app.use(
        helmet.frameguard({
          action: 'deny',
        })
      );

      logger.info(`Application Security Middlewares Applied Successfully!`);

      // -------------------------------------------------------------------------------------------- //
      //                                 APPLY APPLICATION MIDDLEWARES                                //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //

      logger.info(`Applying Application Middlewares...`);

      // Middleware to parse the body of the HTTP requests

      // Check if the request is a webhook request
      // A request is a webhook request if the original URL is /api/v1/webhooks/ + the name of the webhook

      // Use JSON parser for all non-webhook routes

      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.originalUrl === '/v1/webhooks/stripe') {
          next();
        } else {
          express.json()(req, res, next);
        }
      });

      // Middleware that is responsible for initializing the context for each request.
      app.use(httpContext.middleware);

      // Middleware to log all the HTTP requests
      app.use(RequestHandlerMiddleware);

      // Routes middlewares

      app.use(ConfigRoute);
      app.use(API_ROUTE, FilesRoute);
      app.use(API_ROUTE, ReviewsRoute);
      app.use(API_ROUTE, AuthRoute);
      app.use(API_ROUTE, CustomersRoute);
      app.use(API_ROUTE, HealthUnitsRoute);
      app.use(API_ROUTE, PatientsRoute);

      app.use(API_ROUTE, OrdersRoute);
      app.use(API_ROUTE, ServicesRoute);
      app.use(API_ROUTE, CollaboratorsRoute);
      app.use(API_ROUTE, CalendarRoute);
      app.use(API_ROUTE, WebHooksRoute);
      app.use(API_ROUTE, NotificationsRoute);
      app.use(API_ROUTE, PaymentsRoute);


      // Middleware to handle and log all the errors
      app.use(ErrorHandlerMiddleware);
      // Middleware to handle and log all the HTTP responses
      app.use(ResponseHandlerMiddleware);

      logger.info(`Application Middlewares Applied Successfully!`);

      // -------------------------------------------------------------------------------------------- //
      //                                 APPLY APPLICATION SIGNALS                                    //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                         //
      // -------------------------------------------------------------------------------------------- //

      // Handle SIGINT signal
      app.on('SIGINT', () => {
        // Handle SIGINT signal
      });

      app.on('SIGUSR1', () => {
        // Handle SIGUSR1 signal
      });
    } catch (error) {
      console.log(`Unable to start Express Application: ${error}`);
      // throw new HTTPError._500(`Unable to start Express Application: ${error}`);
    }

    try {
      // -------------------------------------------------------------------------------------------- //
      //                                       ASSETS PREPARATION                                     //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //

      logger.info('Fetching all the necessary assets...');

      /**
       * Gets all the services from the database and stores them in the cache
       */
      await getServices();

      logger.info('Fetched all the necessary assets successfully!');
    } catch (error) {
      // throw new HTTPError._503(`Service Unavailable: ${error}`);
    }

    try {
      // -------------------------------------------------------------------------------------------- //
      //                              STARTS LISTENING FOR HTTP REQUESTS                              //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //

      logger.info(`Starting to listen for HTTP requests...`);

      // Starts listening for HTTP requests
      app.listen(SERVER_PORT, () => {
        logger.info(`Successfully listening for HTTP requests on port: ${SERVER_PORT}`);

        swaggerDocs(app, SERVER_PORT);

        logger.info(`Server started successfully! 🚀`);
      });

      app.on('error', (error: any) => {
        console.log(`Unable to start the HTTP Server: ${error}`);
        // throw new HTTPError._500(`Unable to start the HTTP Server: ${error}`);
      });
    } catch (error) {
      console.log(`Unable to start the HTTP Server: ${error}`);
      // throw new HTTPError._500(`Unable to start the HTTP Server: ${error}`);
    }
  } catch (error) {
    console.log(`Internal Error: ${error}`);
    // throw new HTTPError._500(`Internal Error: ${error}`);
  }
};

main();
