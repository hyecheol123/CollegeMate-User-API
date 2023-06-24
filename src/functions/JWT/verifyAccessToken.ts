/**
 * Verifying Access Token (JSON Web Token)
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as jwt from 'jsonwebtoken';
import AuthToken, {JWTObject} from '../../datatypes/Token/AuthToken';
import ForbiddenError from '../../exceptions/ForbiddenError';

/**
 * Method to verify AccessToken
 *
 * @param {string} accessToken JWT accessToken
 * @param {string} jwtAccessKey JWT access secret
 * @return {AuthToken} authentication token content
 */
export default function verifyServerAdminToken(
  serverAdminToken: string,
  jwtAccessKey: string
): AuthToken {
  let tokenContents: JWTObject;
  try {
    // Check token's validity and contents
    tokenContents = jwt.verify(serverAdminToken, jwtAccessKey, {
      algorithms: ['HS512'],
    }) as JWTObject;
  } catch (e) {
    throw new ForbiddenError();
  }

  // Check token content
  if (tokenContents.type !== 'access' || tokenContents.tokenType !== 'user') {
    throw new ForbiddenError();
  }

  // Return
  delete tokenContents.iat;
  delete tokenContents.exp;
  return tokenContents as AuthToken;
}
