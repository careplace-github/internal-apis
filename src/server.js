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


import express from "express"
import cors from "cors"

import mongodb from "mongodb"
import dotenv from "dotenv"
// Loads environment constants"
import {env, api_version, api_url, DB_users_uri, DB_users_ns, DB_port} from "./config/constants/index.js"
// Router exports  
import userAPIs from "./api/v1/routes/users.route.js"
import { JWT_secret } from "./config/constants/index.js"


// Initialize MongoDB client
const MongoClient = mongodb.MongoClient

// Initialize express application
const app = express()

// Apply application middlewares
app.use(cors())
app.use(express.json())

// Inject sub router and APIs
app.use(api_url, userAPIs)



//app.use("*", (req, res) => res.status(404).json({ error: "not found"}))
//app.use('/users', userAPIs)
//app.use(process.env.API_URL, caregivers)




const main = async () => {

    try {

        // Connects to MongoDB Databases
        await MongoClient.connect(DB_users_uri)
            .catch(err => {
                console.error(err.stack)
                process.exit(1)
            })
            .then(async client => {
                console.log(`Connected to database: ${DB_users_ns}`)
                 // Connects to MongoDB Collections
                //await CaregiversDAO.injectDB(client) 
            })
        
        // Starts server
        app.listen(DB_port, () => {
        console.log(`Server started on port: ${DB_port}`)
        console.log(`Server environment mode: ${env}`)
        console.log(`HTTP requests API version: ${api_version}`)
        console.log(`API route: ${api_url}`)
        })
        
    } catch (error) {
        console.log(`Unable to start the server: ${err}`)
    }
    
    }


main();

