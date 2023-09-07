// express-validator
import { body } from 'express-validator';
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

// swagger
import logger from '@logger';
import swaggerDocs from './documentation/swagger';
// @logger

const main = async () => {
  let app: express.Application = express();
  const MAX_RECONNECT_ATTEMPTS = 10;
  let currentReconnectAttempts = 0;

  let MONGODB_DB_ACTIVE_URI: string;
  let MONGODB_DB_DELETES_URI: string;

  try {
    logger.info(`
    // -------------------------------------------------------------------------------------------- //
    //                                                                                              //
    //                                      CAREPLACE REST API                                      //
    //                                                                                              //
    // -------------------------------------------------------------------------------------------- //
    \n`);

    logger.info(`Initializing the server... \n \n`);

    /**
     * Load AWS Secrets
     *
     *  For the modules to work the environment variables must be loaded first
     */
    const { loadAWSSecrets } = require('@packages/services/secrets.service');
    // Now that the environment variables are loaded, we can load the modules (we need to use require instead of import because import statements are hoisted)
    await loadAWSSecrets();

    // routes
    const {
      AuthRoute,
      HealthUnitsRoute,
      CollaboratorsRoute,
      CaregiversRoute,
      CustomersRoute,
      ServicesRoute,
      OrdersRoute,
      CalendarRoute,
      WebhooksRoute,
      PatientsRoute,
      DashboardRoute,
      PaymentsRoute,
      ReviewsRoute,
      LeadsRoute,
    } = require('@api/v1/routes');

    const { AdminAuthRoute, AdminHealthUnitsRoute } = require('@api/admin/v1/routes');

    const { FilesRoute } = require('@api/files/v1/routes');

    const {
      RequestHandlerMiddleware,
      ResponseHandlerMiddleware,
      ErrorHandlerMiddleware,
    } = require('@packages/middlewares');

    // -------------------------------------------------------------------------------------------- //
    //                        APPLY DATABASE CONNECTION AND ERROR HANDLING                          //
    //                                                                                              //
    //                                                                                              //
    //  @see                                                                                        //
    // -------------------------------------------------------------------------------------------- //

    // MongoDB connection options
    const options: mongoose.ConnectOptions = {
      // useCreateIndex: true, //
      autoIndex: false, // Don't build indexes
      // useFindAndModify: false, // Use the new Server Discover and Monitoring engine
      maxPoolSize: 100, // Maintain up to 100 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    mongoose.set('strictQuery', true);

    MONGODB_DB_ACTIVE_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URI}/${process.env.MONGODB_DB_ACTIVE_NS}?retryWrites=true&w=majority`;
    MONGODB_DB_DELETES_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URI}/${process.env.MONGODB_DB_DELETES_NS}?retryWrites=true&w=majority`;

    logger.info(`Connecting to MongoDB Cluster: ${process.env.MONGODB_CLUSTER_URI}`);

    // Attempts to create a connection to the MongoDB Database and handles the error of the connection fails
    let db_connection = await mongoose.connect(MONGODB_DB_ACTIVE_URI, options);

    logger.info(`Connecting to MongoDB Database '${process.env.MONGODB_DB_ACTIVE_NS}'...`);

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
          db_connection = await mongoose.connect(
            process.env.MONGODB_DB_ACTIVE_URI as string,
            options
          );
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
    logger.info(
      `Connected to MongoDB Database '${process.env.MONGODB_DB_ACTIVE_NS}' Successfully!`
    );
    // Store the connection in a global variable
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

      // app.use('/packages/webhooks/stripe/connect', bodyParser.raw({type: "*/*"}))

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
              value = value.map((element) => element.trim().escape());

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
      // A request is a webhook request if the original URL is /packages/webhooks/ + the name of the webhook

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

      // API Routes
      app.use(process.env.API_ROUTE as string, FilesRoute);
      app.use(process.env.API_ROUTE as string, ReviewsRoute);
      app.use(process.env.API_ROUTE as string, AuthRoute);
      app.use(process.env.API_ROUTE as string, PatientsRoute);
      app.use(process.env.API_ROUTE as string, CustomersRoute);
      app.use(process.env.API_ROUTE as string, OrdersRoute);
      app.use(process.env.API_ROUTE as string, ServicesRoute);
      app.use(process.env.API_ROUTE as string, CollaboratorsRoute);
      app.use(process.env.API_ROUTE as string, CaregiversRoute);
      app.use(process.env.API_ROUTE as string, CalendarRoute);
      app.use(process.env.API_ROUTE as string, DashboardRoute);
      app.use(process.env.API_ROUTE as string, WebhooksRoute);
      app.use(process.env.API_ROUTE as string, PaymentsRoute);
      app.use(process.env.API_ROUTE as string, HealthUnitsRoute);

      app.use(process.env.API_ROUTE as string, LeadsRoute);

      // Admin API Routes
      app.use(process.env.ADMIN_API_ROUTE as string, AdminAuthRoute);
      app.use(process.env.ADMIN_API_ROUTE as string, AdminHealthUnitsRoute);

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

      logger.info(`Fetched all the necessary assets successfully! \n`);
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
      app.listen(process.env.PORT, () => {
        logger.info(`Successfully listening for HTTP requests on port: ${process.env.PORT}`);

        logger.info(`Server Settings: `);
        logger.info(`NODE_ENV: '${process.env.NODE_ENV}'`);
        logger.info(`HOST: ${process.env.HOST} `);
        logger.info(`API Version: ${process.env.API_VERSION} `);
        logger.info(`API Route: ${process.env.API_ROUTE as string} `);
        logger.info(`API URL: ${process.env.API_URL} `);
        logger.info(`Server Port: ${process.env.PORT}`);
        logger.info(`Marketplace Base URL: ${process.env.MARKETPLACE_BASE_URL}`);
        logger.info(`Business Base URL: ${process.env.BUSINESS_BASE_URL} \n`);

        swaggerDocs(app, process.env.PORT);

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
  } catch (error: any) {
    logger.error(`Internal Error: ${error}`);

    if (!error?.isOperational) {
      process.exit(1);
    }
  }
};

main();
