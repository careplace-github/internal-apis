import LayerError from '../layerError';

/**
 * ``INVALID_CODE`` is a ``LayerError`` that is thrown when a code is invalid.
 */
export default class InvalidCode extends LayerError {
  constructor(message: string) {
    super(message, 'INVALID_CODE');
  }
}
