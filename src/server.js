/*
 * [EN]
 *
 * Copyright (C) CARELY, LDA - All Rights Reserved
 *
 * Unauthorized copying or distributing of this file via any medium is strictly prohibited.
 * This file is confidential and intellectual property of Carely, Lda.
 * Contact: contact@carely.pt
 *
 * © 2022 Careplace. All Rights Reserved.
 *
 *
 * [PT]
 *
 * Copyright (C) Carely, LDA - Todos os direitos reservados
 *
 * A cópia ou distribuição não autorizada deste ficheiro por qualquer meio é estritamente proibida.
 * Este ficheiro é confidencial e parte da propriedade intelectual da Carely, Lda.
 * Contacto: contact@carely.pt
 *
 * © 2022 Carely. Todos os direitos reservados.
 */

// Import the express module
import express from "express";

// Import application security modules
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import xss from "xss-clean";

import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

// Import mongoose
import mongoose from "mongoose";

import * as Error from "./api/v1/middlewares/errors/index.js";

// Loads environment constants"
import {
  env,
  host,
  api_version,
  api_url,
  SERVER_Port,
  MONGODB_db_active_uri,
  MONGODB_db_deletes_uri,
  MONGODB_db_active,
  MONGODB_db_deletes,
} from "./config/constants/index.js";

// Import router exports
import configAPI from "./api/v1/routes/config.route.js";
import emailsAPI from "./api/v1/routes/emails.route.js";
import filesAPI from "./api/v1/routes/files.route.js";
import authAPI from "./api/v1/routes/authentication.route.js";
import usersAPI from "./api/v1/routes/users.route.js";
import companiesAPI from "./api/v1/routes/companies.route.js";
import servicesAPI from "./api/v1/routes/services.route.js";
import ordersAPI from "./api/v1/routes/orders.route.js";
import calendarAPI from "./api/v1/routes/calendar.route.js";

import getServices from "./api/v1/helpers/services.helper.js";

// Import logger
import inputValidation from "./api/v1/middlewares/validators/inputValidation.middleware.js";
import logger from "./logs/logger.js";
import requestLogger from "./api/v1/middlewares/server/requestHandler.middleware.js";
import errorLogger from "./api/v1/middlewares/errors/errorHandler.middleware.js";
import responseLogger from "./api/v1/middlewares/server/responseHandler.middleware.js";

const main = async () => {
  try {
    logger.info(`
     // -------------------------------------------------------------------------------------------- //
     //                                                                                              // 
     //                                      CAREPLACE REST API                                      //         
     //                                                                                              //                            
     // -------------------------------------------------------------------------------------------- //
     \n`);

    logger.info(`Server settings: `);
    logger.info(`Running in '${env}' environment`);
    logger.info(`Host: ${host} `);
    logger.info(`API Version: ${api_version} `);
    logger.info(`API URL: ${api_url} `);
    logger.info(`Server Port: ${SERVER_Port} \n \n`);

    logger.info(`Initializing the server... \n \n`);

    // -------------------------------------------------------------------------------------------- //
    //                        APPLY DATABASE CONNECTION AND ERROR HANDLING                          //
    //                                                                                              //
    //                                                                                              //
    //  @see                                                                                        //
    // -------------------------------------------------------------------------------------------- //

    // MongoDB connection options
    let options = {
      //useCreateIndex: true, //
      autoIndex: false, // Don't build indexes
      useNewUrlParser: true, // Use the new Server Discover and Monitoring engine
      useUnifiedTopology: true, // Use the new Server Discover and Monitoring engine
      //useFindAndModify: false, // Use the new Server Discover and Monitoring engine

      maxPoolSize: 100, // Maintain up to 100 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    logger.info(
      `Attempting to connect to MongoDB Database: ${MONGODB_db_active}`
    );

    

    // Attempts to create a connection to the MongoDB Database and handles the error of the connection fails
    let db_connection = await mongoose.connect(MONGODB_db_active_uri, options);

    /**
     *  Handle connection errors
     */
    db_connection.connection.on("error", (err) => {
      throw new Error._503(`MongoDB Connection Error: ${err}`);
    });


    db_connection.connection.on("reconnected", (err) => {
      logger.info(`MongoDB Connection Reconnected: ${err}`);
    });

    db_connection.connection.on("disconnected", (err) => {
      throw new Error._503(`MongoDB Connection Error: ${err}`);
    });

    db_connection.connection.on("timeout", (err) => {
      throw new Error._503(`MongoDB Connection Error: ${err}`);
    });

    db_connection.connection.on("close", (err) => {
      throw new Error._503(`MongoDB Connection Error: ${err}`);
    });

    

    // Successfuly connected to MongoDB
    logger.info(`Successfuly connected to MongoDB databse: '${MONGODB_db_active}'`);
    //Store the connection in a global variable
    global.db = db_connection.connection;

    try {
      // -------------------------------------------------------------------------------------------- //
      //                                INITIALIZE EXPRESS APPLICATION                                //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //
      var app = express();

      // Apply application middlewares
      app.use(express.json());

      // -------------------------------------------------------------------------------------------- //
      //         APPLY APPLICATION SECURITY MIDDLEWARES AND ATTACKS PROTECTION & HANDLING             //
      //                                                                                              //
      //                                                                                              //
      //  @see https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html        //
      //  @see https://nodejs.org/en/docs/guides/security                                             //
      // -------------------------------------------------------------------------------------------- //

      /**
       * Prevents HTTP Parameter Pollution & Prototype Pollution Attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#prototype-pollution-attacks-cwe-1321
       */
      app.use(hpp());
      app.use(helmet());

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

      /**
       * Prevents Denial of Service (DoS) attacks
       *
       * @see https://nodejs.org/en/docs/guides/security/#denial-of-service-of-http-server-cwe-400
       */

      app.use(
        express.urlencoded({
          // Limits the size of the JSON payload to 5MB

          limit: "5mb",

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
          max: 100, // limit each IP to 100 requests per windowMs
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
            scriptSrc: [
              "'self'",
              "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.min.js",
            ],
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
          reportUri: "https://example.com",
        })
      );

      /**
       * Prevents Inconsistent Interpretation of HTTP Requests Attacks
       *
       * @see https://github.com/nodejs/node/blob/main/SECURITY.md#inconsistent-interpretation-of-http-requests-cwe-444
       */
      app.use(
        helmet.referrerPolicy({
          policy: "same-origin",
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
          permittedPolicies: "none",
        })
      );

      /**
       * Prevents Insecure Deserialization Attacks
       *
       * @see
       */
      app.use(
        helmet.frameguard({
          action: "deny",
        })
      );

      // -------------------------------------------------------------------------------------------- //
      //                                 APPLY APPLICATION MIDDLEWARES                                //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                         //
      // -------------------------------------------------------------------------------------------- //

      // Middleware to log all the HTTP requests
      app.use(requestLogger);

      // Routes middlewares
      app.use(api_url, configAPI);
      app.use(api_url, emailsAPI);
      app.use(api_url, filesAPI);
      app.use(api_url, authAPI);
      app.use(api_url, usersAPI);
      app.use(api_url, companiesAPI);
      app.use(api_url, ordersAPI);
      app.use(api_url, servicesAPI);
      app.use(api_url, calendarAPI);

      // Middleware to handle and log all the errors
      app.use(errorLogger);
      // Middleware to log all the HTTP responses
      app.use(responseLogger);

      // Middleware to throw internal server errors
      app.on("error", (error) => {
        throw new Error._500(`Internal Server Error: ${error.message}`);
      });

      // -------------------------------------------------------------------------------------------- //
      //                                 APPLY APPLICATION SIGNALS                                    //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                         //
      // -------------------------------------------------------------------------------------------- //

      // Handle SIGINT signal
      app.on("SIGINT", () => {
        // Handle SIGINT signal
      });

      app.on("SIGUSR1", () => {
        // Handle SIGUSR1 signal
      });
    } catch (error) {
      throw new Error._500(`Unable to start Express Application: ${error}`);
    }

    try {
      // -------------------------------------------------------------------------------------------- //
      //                                       ASSETS PREPARATION                                     //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //

      /**
       * Gets all the services from the database and stores them in the cache
       */
      logger.info("Getting all the necessary assets...");
      await getServices();
    } catch (error) {
      throw new Error._503(`Service Unavailable: ${error}`);
    }

    try {
      // -------------------------------------------------------------------------------------------- //
      //                              STARTS LISTENING FOR HTTP REQUESTS                              //
      //                                                                                              //
      //                                                                                              //
      //  @see                                                                                        //
      // -------------------------------------------------------------------------------------------- //

      // Starts listening for HTTP requests
      app.listen(SERVER_Port, () => {
        logger.info(`Listening for HTTP requests on port: ${SERVER_Port}\n`);

        logger.info(`Server started successfully! 🚀`);
      });
    } catch (error) {
      throw new Error._500(`Unable to start the HTTP Server: ${error}`);
    }
  } catch (error) {
    throw new Error._500(`Internal Error: ${error}`);
  }
};

main();
