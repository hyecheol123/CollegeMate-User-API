/**
 * Define 404 Not Found Error based on HTTPError
 * Contains HTTP Status code and message for commonly caused 404 Not Found Error
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import HTTPError from './HTTPError';

/**
 * Authentication Error is a type of HTTPError, of which status code is 404
 */
export default class NotFoundError extends HTTPError {
  /**
   * Constructor for NotFound Error
   */
  constructor() {
    super(404, 'Not Found');
  }
}
