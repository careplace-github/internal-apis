import { Schema, model} from "mongoose"

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

const token = model("crm_tokens", tokenSchema)
export default token