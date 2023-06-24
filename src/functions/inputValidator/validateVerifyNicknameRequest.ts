/**
 * Validate user input - Verify Nickname Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateVerifyNicknameRequest = new Ajv().compile({
  type: 'object',
  properties: {
    nickname: {type: 'string'},
  },
  required: ['nickname'],
  additionalProperties: false,
});
