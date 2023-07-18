import LayerError from '../layer-error';

/**
 * ``ATTEMPT_LIMIT`` is a ``LayerError`` that is thrown when a limit of attempts is reached.
 */
export default class AttemptLimit extends LayerError {
  constructor(message: string, type = 'DUPLICATE_KEY') {
    super(message, type);
  }
}
