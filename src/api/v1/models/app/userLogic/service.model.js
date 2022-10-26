import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "../../_archive/tokens.model.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    name: {type: String, required: true, unique: true},

    description: {type: String, required: true},
    
    photoURL: {type: String, required: true},

},{ 
    timestamps: true
})

const User = mongoose.model('service', userSchema)
export default Service