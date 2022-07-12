import mongoose from "mongoose"
import hash from "bcryptjs"
import sign from "jsonwebtoken"
import randomBytes from "crypto"
import pick from "lodash"
import token from "./token.model.js"
import { JWT_secret } from "../../../config/constants/index.js"


const Schema = mongoose.Schema
const tokens = token.Schema 

const userSchema = new Schema ({
    name:{
        type: String,
        required: true,
    },

    username:{
        type: String,
        required: true,
    },

    email:{
        type: String,
        required: true,
    },

    password:{
        type: String,
        required: true,
    },

    verified:{
        type: Boolean,
        default: false,
    },

    verificationCode:{
        type: String,
        required: false,
    },

    resetPasswordToken:{
        type: Schema.Types.ObjectId, ref: 'Event' ,
        required: false,
    },

  

},
{ timestamps: true}
)

userSchema.pre('save', async function (next) {
    let user = this
    if(!user.isModified("password")) return next()
    // @todo confirm round of source
    user.password = await hash(user.password, 14)
    next()
})

userSchema.methods.comparePassword = async function (password) {
    return await compare(password, this.password)
}

userSchema.methods.generateJWT = async function () {
    let payload = {
        username: this.username,
        email: this.email,
        name: this.name,
        id: this._id
    };
    // @todo
    return await sign(payload, JWT_secret, {expiresIn: "1 day" })
}

userSchema.methods.generatePasswordResetToken = function () {
    //@todo confirm expiration date and token size
    this.resetPasswordToken.token.expirationDate = Date.now() + 36000000
    this.resetPasswordToken.token.tokenString = randomBytes(20).toString("hex")
}

userSchema.methods.getUserInfo = function () {
    return pick(this, ["_id", "username", "email", "name" ])
}

const User = mongoose.model("crm_users", userSchema)
export default User