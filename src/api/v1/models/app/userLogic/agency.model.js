import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "../../_archive/tokens.model.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    ownerId: {type: String, required: true, unique: true},

    name:{type: String,required: true},

    photoURL:{type: String, required: false, unique: true},

    // Array with the agency employees
    team:{type: Array, required: true},

    // Array with the agency active clients
    clients: {type: Array, required: true},

    email:{type: String, required: true, unique: true},

    phoneNumber:{type: String, required: false, unique: true},

    address:{type: String, required: false},

    city:{type: String, required: false},

    country:{type: String, required: false},

    zipCode:{type: String, required: false}
    

},{ 
    timestamps: true
})

const User = mongoose.model('agency', userSchema)
export default Agency