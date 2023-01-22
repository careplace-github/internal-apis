import LayerError from "../layerError.js";

/**
 * ``FORBIDEN`` is a ``LayerError`` that is thrown when a user is not allowed to access a resource.
 */
export default class InvalidCode extends LayerError {
  constructor(message) {
    super(message, "FORBIDDEN");
  }
}
