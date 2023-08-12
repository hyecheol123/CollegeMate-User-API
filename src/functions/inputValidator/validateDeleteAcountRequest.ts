/**
 * Validate user input - Delete Account Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateDeleteAcountRequest = new Ajv().compile({
  type: 'object',
  properties: {
    otpRequestId: {type: 'string'},
  },
  required: ['otpRequestId'],
  additionalProperties: false,
});
