import { check } from "express-validator"

const name = check('name', "Name is required.").not().isEmpty()
const email = check('name', "Email address is not valid.").isEmail()
const password = check('password', "Password is required. of minimum length of 8").isLength({min: 8, max: 30})

export const RegisterUserValidations = [name, email, password]

// @todo Is this necessary?
//export const Authen = [username, password]

