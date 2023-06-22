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
    graduationYear: {type: 'number'},
    tncVersion: {type: 'string'},
  },
  required: ['email', 'nickname', 'major', 'graduationYear', 'tncVersion'],
  additionalProperties: false,
});
