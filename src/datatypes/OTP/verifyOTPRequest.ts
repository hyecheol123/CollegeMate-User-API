/**
 * Function to verify OTP Request from Authentication API
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import {Request} from 'express';
import OTP from '../OTP/OTP';
import NotFoundError from '../../exceptions/NotFoundError';

/**
 * Function to verify OTP Request from Authentication API
 *
 * @param {string} requestID Request ID of OTP
 * @param {Request} req express Request object
 * @return {Promise<OTP>} OTP object
 */
export default async function verifyOTPRequest(
  requestID: string,
  req: Request
): Promise<OTP> {
  let response = await fetch(
    `https://api.collegemate.app/auth/${requestID}/verify`,
    {
      method: 'GET',
      headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
    }
  );

  // TODO: WHY NOT 403?
  if (response.status === 401) {
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

  if (response.status === 404) {
    // Requested OTP request ID not found
    throw new NotFoundError();
  }

  if (response.status !== 200) {
    throw new Error('[Fail on checking OTP Request Status]');
  }

  // OTP Request found
  const OTPRequestInfo = await response.json();
  const OTPResponse: OTP = {
    email: OTPRequestInfo.email,
    purpose: OTPRequestInfo.purpose,
    verified: false,
  };

  if (OTPRequestInfo.verified) {
    OTPResponse.verified = true;
    OTPResponse.expireAt = OTPRequestInfo.expireAt;
  } else {
    OTPResponse.verified = false;
  }

  return OTPResponse;
}
