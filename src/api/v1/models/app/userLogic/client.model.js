import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "../_archive/tokens.model.js"
import { JWT_secret } from "../../../../config/constants/index.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    cognitoId: {type: String, required: true, unique: true},

    // OrderID must be Active or Pending
    orderId: {type: String, required: true, unique: true},
    

},{ 
    timestamps: true
})

const User = mongoose.model('client', userSchema)
export default Client