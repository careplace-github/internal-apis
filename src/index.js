import app from "./server.js"
import mongodb from "mongodb"
import dotenv from "dotenv"

"Loads environment variables"
dotenv.config({path: './config/.env/.env'}) 
const env = process.env.NODE_ENV
dotenv.config({path: `./config/.env/.env.${env}`}) 

const MongoClient = mongodb.MongoClient

const DB_port = process.env.DB_PORT || process.env.DB_PORT_BACKUP
const DB_user = process.env.DB_USER
const DB_password = process.env.DB_PASSWORD
const DB_users_ns = process.env.DB_CRM_USERS_NS
const DB_users_uri = `mongodb+srv://${DB_user}:${DB_password}@crm-cluster.gptj1ti.mongodb.net/${DB_users_ns}?retryWrites=true&w=majorit`
const DB_orders_ns = process.env.DB_CRM_USERS_NS
const DB_orders_uri = `mongodb+srv://${DB_user}:${DB_password}@crm-cluster.gptj1ti.mongodb.net/${DB_orders_ns}?retryWrites=true&w=majorit`



// Connects to MongoDB Databases
MongoClient.connect(DB_users_uri)
    .catch(err => {
        console.error(err.stack)
        process.exit(1)
    })
    .then(async client => {
        // Connects to MongoDB Collections
        //await CaregiversDAO.injectDB(client) 
    })
    

// Connects to MongoDB Databases
MongoClient.connect(DB_orders_uri)
    .catch(err => {
        console.error(err.stack)
        process.exit(1)
    })
    .then(async client => {
        // Connects to MongoDB Collections
        //await CaregiversDAO.injectDB(client) 
    })
    

       
// Starts server
app.listen(DB_port, () => {
console.log(`Server in ${env} mode.`)
console.log(`Listening on port ${DB_port}.`)
})