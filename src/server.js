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
import users from "./api/v1/routes/users.route.js"
import dotenv from "dotenv"



"Loads environment variables"
dotenv.config({path: './config/.env/.env'}) 
const env = process.env.NODE_ENV
console.log(env)
const api = process.env.API_URL
const api_url = api.concat(process.env.API_VERSION)
console.log(api_url)
dotenv.config({path: `./src/config/.env/.env.${env}`}) 




const app = express()

app.use(cors())
app.use(express.json())

//app.use(process.env.API_URL, caregivers)


app.use(api_url, users)
app.use("*", (req, res) => res.status(404).json({ error: "not found"}))

export default app

