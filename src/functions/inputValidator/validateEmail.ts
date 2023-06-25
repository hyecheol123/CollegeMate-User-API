/**
 * Validate user input - User Post Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const validateEmail = addFormats(new Ajv()).compile({
  type: 'string',
  format: 'email',
});
