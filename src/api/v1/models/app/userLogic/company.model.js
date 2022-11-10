import mongoose from "mongoose"


const Schema = mongoose.Schema

const userSchema = new Schema ({

    userId: {type: String, required: true, unique: true},

    name:{type: String,required: true},

    photoURL:{type: String, required: false, unique: true},

    // Array with the agency employees
    team:{type: Array, required: true},

    email:{type: String, required: true, unique: true},

    phoneNumber:{type: String, required: false, unique: true},

    address:{type: String, required: false},

    zipCode:{type: String, required: false},

    city:{type: String, required: false},

    country:{type: String, required: false},



    // Array with the agency active clients
    clients: {type: Array, required: false},
    

},{ 
    timestamps: true
})

const Company = mongoose.model('company', userSchema)
export default Agency