/**
 * Validate user input - User Update Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const validateUserUpdateRequest = addFormats(new Ajv()).compile({
  type: 'object',
  properties: {
    nickname: {type: 'string'},
    major: {type: 'string'},
    // set allowed values for graduationYear to be between 2015 and 2028
    graduationYear: {type: 'number', minimum: 2015, maximum: 2028},
  },
  anyRequired: ['nickname', 'major', 'graduationYear'],
  additionalProperties: false,
});
