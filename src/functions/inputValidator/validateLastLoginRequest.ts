/**
 * Validate user input - Update Last Login Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';
import addFormat from 'ajv-formats';

export const validateLastLoginRequest = addFormat(new Ajv()).compile({
  type: 'object',
  properties: {
    lastLogin: {type: 'string'},
  },
  required: ['lastLogin'],
  additionalProperties: false,
});