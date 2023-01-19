import LayerError from "../layerError.js";

/**
 * ``INTERNAL_ERROR`` is a ``LayerError`` that is thrown when a resource is not found (eg. DataBase, S3, etc).
 */
export default class InternalError extends LayerError {
  constructor(type = "INTERNAL_ERROR", message) {
    super(type, message);
  }
}
