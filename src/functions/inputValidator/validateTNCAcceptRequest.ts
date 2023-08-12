/**
 * Validate user input - TnC Accept Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateTNCAcceptRequest = new Ajv().compile({
  type: 'object',
  properties: {
    tncVersion: {type: 'string'},
  },
  required: ['tncVersion'],
  additionalProperties: false,
});
