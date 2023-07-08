/**
 * Function to verify OTP Request from Authentication API
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import {Request} from 'express';
import OTPResponse from './OTPResponse';

/**
 * Function to verify OTP Request from Authentication API
 *
 * @param {string} requestID Request ID of OTP
 * @param {Request} req express Request object
 * @return {Promise<OTPResponse>} OTP object
 */
export default async function getVerifyOTP(
  requestID: string,
  req: Request
): Promise<OTPResponse> {
  let response = await fetch(
    `https://api.collegemate.app/auth/${requestID}/verify`,
    {
      method: 'GET',
      headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
    }
  );

  if (response.status === 401 || response.status === 403) {
    // Retry with new serverAdminToken
    response = await fetch('https://api.collegemate.app/auth/login', {
      method: 'GET',
      headers: {'X-SERVER-KEY': req.app.get('serverAdminKey')},
    });
    if (response.status !== 200) {
      throw new Error('[Fail on serverAdminToken renewal]');
    }
    const serverAdminTokenReq = (await response.json()).serverAdminToken;
    req.app.set('serverAdminToken', serverAdminTokenReq);

    response = await fetch(
      `https://api.collegemate.app/auth/${requestID}/verify`,
      {
        method: 'GET',
        headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
      }
    );
  }

  if (response.status !== 200) {
    throw new Error('[Fail on checking OTP Request Verification Status]');
  }

  // OTP Request found
  const OTPRequestInfo = (await response.json()) as OTPResponse;
  return {
    email: OTPRequestInfo.email,
    purpose: OTPRequestInfo.purpose,
    verified: OTPRequestInfo.verified,
    expireAt: OTPRequestInfo.verified
      ? new Date(OTPRequestInfo.expireAt as string)
      : undefined,
  };
}
