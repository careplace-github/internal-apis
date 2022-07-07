import app from "./server.js"
import mongodb from "mongodb"
import dotenv from "dotenv"
import CaregiversDAO from "./dao/caregiversDAO.js"
import ReviewsDAO from "./dao/reviewsDAO.js"

dotenv.config()
const MongoClient = mongodb.MongoClient

const port = process.env.PORT || 8000

MongoClient.connect(
    process.env.USERS_DB_URI, 
    {
        
        // poolSize: 5000,
        // wtimeout: 2500,
       // useNewUrlParse: true
     }
)
    .catch(err => {
        console.error(err.stack)
        process.exit(1)
})
    .then(async client => {
        // Connects to MongoDB Collections
        await CaregiversDAO.injectDB(client)
        await ReviewsDAO.injectDB(client)
        
        app.listen(port, () => {
            console.log(`listening on port ${port}`)
        })
    })