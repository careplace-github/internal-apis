import LayerError from "../layerError.js";

/**
 * ``INVALID_PARAMETER`` is a ``LayerError`` that is thrown when a parameter is invalid.
 */
export default class InvalidParameter extends LayerError {
  constructor(message) {
    super(message, "INVALID_PARAMETER");
  }
}
