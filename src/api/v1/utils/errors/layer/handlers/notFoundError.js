import LayerError from "../layerError.js";

/**
 * ``NOT_FOUND`` is a ``LayerError`` that is thrown when a resource is not found (eg. DataBase, S3, etc).
 */
export default class NotFound extends LayerError {
  constructor(type = "NOT_FOUND", message) {
    super(type, message);
  }
}
