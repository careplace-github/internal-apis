//import registerUserValitation from "./validators/users.validator"
import { validationResult } from 'express-validator';
import { HTTPError } from '@api/v1/utils/errors/http';

export default function (req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Throw a 400 error with the errors array
    throw new HTTPError._400(errors);
  }

  next();
}
