import {check} from "express-validator"

const name = check("name").not().isEmpty().withMessage("Name is required")
const email = check("email").isEmail().withMessage("Email must be a valid email")
const password = check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
const confirmPassword = check("confirmPassword").custom((value, { req }) => {
    if (value != req.body.password) {
        throw new Error("Passwords do not match")
    }
    return true
}
).withMessage("Passwords do not match")

export const registerUserValidation = [name, email, password, confirmPassword] 


