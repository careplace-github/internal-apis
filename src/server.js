import express from "express"
import cors from "cors"
import users from "./api/v1/routes/users.route.js"
import dotenv from "dotenv"

"Loads environment variables"
dotenv.config({path: '../.env' }) 

const app = express()

app.use(cors())
app.use(express.json())

//app.use(process.env.API_URL, caregivers)


app.use(process.env.API_URL, users)
app.use("*", (req, res) => res.status(404).json({ error: "not found"}))

export default app

