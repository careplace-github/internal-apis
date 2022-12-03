/*  
 * [EN]
 *
 * Copyright (C) Carely, LDA - All Rights Reserved
 *
 * Unauthorized copying or distributing of this file via any medium is strictly prohibited.
 * This file is confidential and intellectual property of Carely, Lda.
 * Contact: contact@carely.pt
 * 
 * © 2022 Carely. All Rights Reserved.
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
import express from "express"
import cors from "cors"

// Import logger
import logger from "./logs/logger.js"

import mongodb from "mongodb"
import dotenv from "dotenv"
import usersDAO from "./api/v1/db/usersDAO.js"
import companiesDAO from "./api/v1/db/companiesDAO.js"
// Loads environment constants"
import {env, api_version, api_url, DB_uri, DB_name, COLLECTION_users_ns, COLLECTION_companies_ns, SERVER_Port} from "./config/constants/index.js"
// Router exports  
import configAPI from "./api/v1/routes/config.route.js"
import authAPI from "./api/v1/routes/authentication.route.js"
import filesAPI from "./api/v1/routes/files.route.js"

import usersAPI from "./api/v1/routes/users.route.js"
import companiesAPI from "./api/v1/routes/companies.route.js"








import { JWT_secret } from "./config/constants/index.js"


// Initialize MongoDB client
const MongoClient = mongodb.MongoClient

// Initialize express application
const app = express()

// Apply application middlewares
app.use(cors())
app.use(express.json())

// Inject sub router and APIs
app.use(api_url, usersAPI)
app.use(api_url, authAPI)
app.use(api_url, filesAPI)

app.use(api_url, configAPI)
app.use(api_url, companiesAPI)





//app.use("*", (req, res) => res.status(404).json({ error: "not found"}))
//app.use('/users', userAPIs)
//app.use(process.env.API_URL, caregivers)




const main = async () => {

    try {

        // Connects to MongoDB Cluster
        await MongoClient.connect(DB_uri)
            .catch(err => {
               // console.log(DB_users_uri)
               logger.error(`Unable to connect to MongoDB Cluster: ${err}`)
                console.error(err.stack)
                process.exit(1)
                
            })
            
            .then(async client => {
                logger.info(`Connected to database: ${DB_name}`)
                
                // Connects to MongoDB Collections
                await usersDAO.injectDB(client) 
                logger.info(`Connected to collection: ${COLLECTION_users_ns}`)
                await companiesDAO.injectDB(client)
                logger.info(`Connected to collection: ${COLLECTION_companies_ns}`)
            })
        
        // Starts server
        app.listen(SERVER_Port, () => {
        logger.info(`Server started on port: ${SERVER_Port}`)
        logger.info(`Server environment mode: ${env}`)
        logger.info(`HTTP requests API version: ${api_version}`)
        logger.info(`API route: http://localhost:${SERVER_Port}${api_url}` + "\n")
        })
        
    } catch (err) {
        logger.error(`Unable to start the server: ${err}`)
    }
    
    }


main();

