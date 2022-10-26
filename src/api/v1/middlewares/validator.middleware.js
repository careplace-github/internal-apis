//import registerUserValitation from "./validators/users.validator"
import {validationResult} from "express-validator"
import User from "../models/auth/user.model.js"

const validatorMiddleware = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
       return res.status(500).json({
            errors: errors.array()
        })
    }
    next()
}

export default validatorMiddleware