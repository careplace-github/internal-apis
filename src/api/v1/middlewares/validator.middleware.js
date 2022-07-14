//import registerUserValitation from "./validators/users.validator"
import {validationResult} from "express-validator"
import User from "../models/users.model.js"

const validatorMiddleware = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(500).json({
            errors: errors.array()
        
        })
       return
    }
    next()
}

export default validatorMiddleware