/**
 * Validate user input - User Post Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateUserPostRequest = new Ajv().compile({
  type: 'object',
  properties: {
    email: {type: 'string'},
    nickname: {type: 'string'},
    major: {type: 'string'},
    // set allowed values for graduationYear to be between 2015 and 2028
    graduationYear: {type: 'number', minimum: 2015, maximum: 2028},
    tncVersion: {type: 'string'},
  },
  required: ['email', 'nickname', 'major', 'graduationYear', 'tncVersion'],
  additionalProperties: false,
});
