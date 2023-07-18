import LayerError from '../layer-error';

/**
 * ``ATTEMPT_LIMIT`` is a ``LayerError`` that is thrown when a limit of attempts is reached.
 */
export default class AttemptLimit extends LayerError {
  constructor(message: string, type = 'ATTEMPT_LIMIT') {
    super(message, type);
  }
}
