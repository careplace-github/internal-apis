import LayerError from '../layerError';

/**
 * ``NOT_FOUND`` is a ``LayerError`` that is thrown when a resource is not found.
 */
export default class NotFound extends LayerError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
  }
}
