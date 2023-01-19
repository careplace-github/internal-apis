import LayerError from "../layerError.js";

/**
 * ``INVALID_PARAMETER`` is a ``LayerError`` that is thrown when a resource is not found (eg. DataBase, S3, etc).
 */
export default class InvalidParameter extends LayerError {
  constructor(type = "INVALID_PARAMETER", message) {
    super(type, message);
  }
}
