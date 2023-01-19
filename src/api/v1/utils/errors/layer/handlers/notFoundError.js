import LayerError from "../layerError.js";

/**
 * ``NOT_FOUND`` is a ``LayerError`` that is thrown when a resource is not found.
 */
export default class NotFound extends LayerError {
  constructor(message) {
    super(message, "NOT_FOUND");
  }
}
