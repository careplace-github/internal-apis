import LayerError from "../layerError";

/**
 * ``UNAUTHORIZED`` is a ``LayerError`` that is thrown when a user is not authorized.
 */
export default class Unauthorized extends LayerError {
  constructor(message) {
    super(message, "UNAUTHORIZED");
  }
}
