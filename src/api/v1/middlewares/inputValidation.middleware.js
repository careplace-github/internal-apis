//import registerUserValitation from "./validators/users.validator"
import { validationResult } from "express-validator";

export default function inputValidation(validator) {
  return function (req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    next();
  };
}
