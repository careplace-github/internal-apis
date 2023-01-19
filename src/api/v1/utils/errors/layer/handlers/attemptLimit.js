import LayerError from "../layerError.js";

/**
 * ``ATTEMPT_LIMIT`` is a ``LayerError`` that is thrown when a limit of attempts is reached.
 */
export default class AttemptLimit extends LayerError {
  constructor(message) {
    super(message, "ATTEMPT_LIMIT");
  }
}
