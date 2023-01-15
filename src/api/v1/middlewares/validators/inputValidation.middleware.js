//import registerUserValitation from "./validators/users.validator"
import { validationResult } from "express-validator";
import * as Error from "../errors/index.js";

export default function (req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    // Throw a 400 error with the errors array

   throw new Error._400(errors)
  }

  next();
}
