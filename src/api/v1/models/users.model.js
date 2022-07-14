import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "./tokens.model.js"
import { JWT_secret } from "../../../config/constants/index.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    cognitoId: {
        type: String,
        required: true,
    },

    name:{
        type: String,
        required: true,
    },

    email:{
        type: String,
        required: true,
    },

    verified:{
        type: Boolean,
        default: false,
    },

    test: {
        type: String,
        required: true,
    },
    
    userType: {
        type: Schema.Types.ObjectId,
        required: false,
    }

  

},{ 
    timestamps: true
})

const User = mongoose.model('users', userSchema)
export default User