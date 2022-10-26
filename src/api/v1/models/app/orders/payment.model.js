import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "../../_archive/tokens.model.js"


const Schema = mongoose.Schema


const userSchema = new Schema ({

    orderId: {type: String, required: true, unique: true},

    paymentStatus: {type: String, required: true, default: "pending"},

    invoiceURL: {type: String, required: true, unique: true},

    consumerCurrency: {type: String, required: true, default: "EUR"},

    paymentMethod: {type: String, required: true, default: "creditCard"},

    price: {type: Number, required: true},


 
    

},{ 
    timestamps: true
})

const User = mongoose.model('payment', userSchema)
export default Order