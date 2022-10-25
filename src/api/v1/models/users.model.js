import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "./tokens.model.js"
import { JWT_secret } from "../../../config/constants/index.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    cognitoId: {type: String, required: true, unique: true},

    verified:{type: Boolean, required: true, default: false},

    role:{type: String, required: true, default: "user"},

    email:{type: String, required: true, unique: true},

    name:{type: String,required: true},

    photoURL:{type: String, required: false, unique: true},

    phoneNumber:{type: String, required: false, unique: true},

    birthday:{type: Date, required: false},

    age:{type: Number, required: false},

    address:{type: String, required: false},

    city:{type: String, required: false},

    zipCode:{type: String, required: false}
    

},{ 
    timestamps: true
})

const User = mongoose.model('users', userSchema)
export default User