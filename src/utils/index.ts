
// Data
export { default as DateUtils } from './data/date.utils';

// Errors
import { default as _400 } from './errors/http/handlers/400Error';
import { default as _401 } from './errors/http/handlers/401Error';
import { default as _402 } from './errors/http/handlers/402Error';
import { default as _403 } from './errors/http/handlers/403Error';
import { default as _404 } from './errors/http/handlers/404Error';
import { default as _409 } from './errors/http/handlers/409Error';
import { default as _500 } from './errors/http/handlers/500Error';
import { default as _503 } from './errors/http/handlers/503Error';

export const HTTPError = {
  _400,
  _401,
  _402,
  _403,
  _404,
  _409,
  _500,
  _503,
};

import { default as NOT_FOUND } from './errors/layer/handlers/not-found';
import { default as INVALID_PARAMETER } from './errors/layer/handlers/invalid-parameter';
import { default as INTERNAL_ERROR } from './errors/layer/handlers/internal';
import { default as UNAUTHORIZED } from './errors/layer/handlers/unauthorized';
import { default as INVALID_CODE } from './errors/layer/handlers/invalid-code';
import { default as FORBIDDEN } from './errors/layer/handlers/forbidden';
import { default as ATTEMPT_LIMIT } from './errors/layer/handlers/attempt-limit';
import { default as DUPLICATE_KEY } from './errors/layer/handlers/duplicate-key';

export const LayerError = {
  NOT_FOUND,
  INVALID_PARAMETER,
  INTERNAL_ERROR,
  UNAUTHORIZED,
  INVALID_CODE,
  FORBIDDEN,
  ATTEMPT_LIMIT,
  DUPLICATE_KEY,
};
