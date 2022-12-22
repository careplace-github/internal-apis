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
import cors from "cors";

// Import logger
import logger from "./logs/logger.js";

import mongodb from "mongodb";
import dotenv from "dotenv";
import usersDAO from "./api/v1/db/usersDAO.js";
import companiesDAO from "./api/v1/db/companiesDAO.js";
import ordersDAO from "./api/v1/db/ordersDAO.js";
import servicesDAO from "./api/v1/db/servicesDAO.js";
import filesDAO from "./api/v1/db/filesDAO.js";

// Loads environment constants"
import {
  env,
  api_version,
  api_url,
  MONGODB_db_active_uri,
  MONGODB_db_deletes_uri,
  MONGODB_db_active,
  MONGODB_db_deletes,
  MONGODB_collection_users,
  MONGODB_collection_companies,
  MONGODB_collection_orders,
  MONGODB_collection_services,
  MONGODB_collection_files,
  SERVER_Port,
} from "./config/constants/index.js";
// Router exports
import configAPI from "./api/v1/routes/config.route.js";
import emailsAPI from "./api/v1/routes/emails.route.js";
import filesAPI from "./api/v1/routes/files.route.js";

import authAPI from "./api/v1/routes/authentication.route.js";

import usersAPI from "./api/v1/routes/users.route.js";
import companiesAPI from "./api/v1/routes/companies.route.js";
import servicesAPI from "./api/v1/routes/services.route.js";
import ordersAPI from "./api/v1/routes/orders.route.js";

// Import mongoose
import mongoose from "mongoose";

import userSchema from "./api/v1/models/userLogic/users.model.js";
import companySchema from "./api/v1/models/userLogic/companies.model.js";
//import userSchema from  "./api/v1/models/auth/user.model.js";

// Initialize express application
const app = express();

// Apply application middlewares
app.use(cors());
app.use(express.json());

// Inject sub router and APIs
app.use(api_url, configAPI);
app.use(api_url, emailsAPI);
app.use(api_url, filesAPI);

app.use(api_url, authAPI);
app.use(api_url, usersAPI);
app.use(api_url, companiesAPI);
app.use(api_url, ordersAPI);
app.use(api_url, servicesAPI);

const main = async () => {
  try {
    
    // Connects to MongoDB Database
    let client = mongoose.createConnection(MONGODB_db_active_uri);

    usersDAO.injectCollection(client);
    logger.info(`Connected to collection: ${MONGODB_collection_users}`);
    companiesDAO.injectCollection(client);
    logger.info(`Connected to collection: ${MONGODB_collection_companies}`);
    ordersDAO.injectCollection(client);
    logger.info(`Connected to collection: ${MONGODB_collection_orders}`);
    servicesDAO.injectCollection(client);
    logger.info(`Connected to collection: ${MONGODB_collection_services}`);
    filesDAO.injectCollection(client);
    logger.info(`Connected to collection: ${MONGODB_collection_files}`);

    // await mongoose.Collection(MONGODB_collection_users);
    //await mongoose.Collection(MONGODB_collection_companies);
    //mongoose.model("users", userSchema);
    //mongoose.model("companies", companySchema);

    // MONGO_db_active_client.model("users", userSchema);

    // Injects database connections to MongoDB Collections
    //await usersDAO.injectCollection(MONGO_db_active_client);
   
    // await companiesDAO.injectCollection(MONGO_db_active_client);
   

    // Starts server
    app.listen(SERVER_Port, () => {
      logger.info(`Server started on port: ${SERVER_Port}`);
      logger.info(`Server environment mode: ${env}`);
      logger.info(`API version: ${api_version}`);
      logger.info(
        `API route: http://localhost:${SERVER_Port}${api_url}` + "\n"
      );
    });
  } catch (err) {
    logger.error(`Unable to start the server: ${err}`);
  }
};

main();
