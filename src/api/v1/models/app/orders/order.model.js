import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "../../_archive/tokens.model.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    agencyId: {type: String, required: true, unique: true},

    clienteId: {type: String, required: true, unique: true},

    // Pending, Active, Inactive
    orderStatus: {type: String, required: true, default: "pending"},

    agencyAccepted: {type: Boolean, required: true, default: false},

    clientAccepted: {type: Boolean, required: true, default: false},

    // Items of the order with the price and quantity, in this case caregiver services 
    items: {type: Array, required: true},

    // Json with all the information about the order schedule 
    schedule: { type: Object, required: true },

    orderAgencyTotal: {type: Number, required: true},

    clientAgencyTotal: {type: Number, required: true},

    paymentInformation: { type: Object, required: true },
 
    

},{ 
    timestamps: true
})

const User = mongoose.model('order', userSchema)
export default Order