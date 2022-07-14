//import registerUserValitation from "./validators/users.validator"
import {validationResult} from "express-validator"

const validatorMiddleware = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(500).json({
            errors: errors.array()
        })
    }
    next()
}

export default validatorMiddleware