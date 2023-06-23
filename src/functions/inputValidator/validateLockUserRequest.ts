/**
 * Validate user input - Lock User Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateLockUserRequest = new Ajv().compile({
  type: 'object',
  properties: {
    description: {type: 'string'},
  },
  required: ['description'],
  additionalProperties: false,
});
