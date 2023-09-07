import LayerError from '../layer-error';

/**
 * ``FORBIDEN`` is a ``LayerError`` that is thrown when a user is not allowed to access a resource.
 */
export default class InvalidCode extends LayerError {
  constructor(message: string) {
    super(message, 'FORBIDDEN');
  }
}
