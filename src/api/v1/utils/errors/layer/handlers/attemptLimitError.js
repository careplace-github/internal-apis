import LayerError from '../layerError';

/**
 * ``ATTEMPT_LIMIT`` is a ``LayerError`` that is thrown when a limit of attempts is reached.
 */
export default class AttemptLimit extends LayerError {
  constructor(message, type = 'ATTEMPT_LIMIT') {
    super(message, type);
  }
}
