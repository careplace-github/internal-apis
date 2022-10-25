import mongoose from "mongoose"

const Schema = mongoose.Schema

const tokenSchema = new Schema ({
    string:{
        type: String,
        required: true,
    },

    expirationDate:{
        type: Date,
        required: true,
    },

},
{ timestamps: true}
)

const Token = mongoose.model("crm_tokens", tokenSchema)
export default Token