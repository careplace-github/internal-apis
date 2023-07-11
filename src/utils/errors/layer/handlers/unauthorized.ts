import LayerError from '../layer-error';

/**
 * ``UNAUTHORIZED`` is a ``LayerError`` that is thrown when a user is not authorized.
 */
export default class Unauthorized extends LayerError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED');
  }
}
