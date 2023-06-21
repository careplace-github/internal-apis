import LayerError from '../layerError';

/**
 * ``INVALID_PARAMETER`` is a ``LayerError`` that is thrown when a parameter is invalid.
 */
export default class InvalidParameter extends LayerError {
  constructor(message, type = 'INVALID_PARAMETER') {
    super(message, type);
  }
}
