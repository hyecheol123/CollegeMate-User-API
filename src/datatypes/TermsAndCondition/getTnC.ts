/**
 * Function to retrieve latest Terms and Conditions from Miscellaneous API
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import TnC from './TnC';
import {Request} from 'express';

/**
 * Function to retrieve latest TnC from Miscellaneous API
 *
 * @param {Request} req - Express Request object
 * @return {Promise<TnC>} User Profile
 */
export default async function getUserProfile(req: Request): Promise<TnC> {
  const response = await fetch('https://api.collegemate.app/tnc', {
    method: 'GET',
    headers: {'X-APPLICATION-KEY': req.app.get('serverApplicationKey')},
  });

  if (response.status === 403) {
    throw new Error('[Fail on retreiving latest TnC : API Key not allowed]');
  }

  if (response.status === 404) {
    throw new Error('[Fail on retreiving latest TnC : DB entry not found]');
  }

  if (response.status !== 200) {
    throw new Error('[Fail on retreiving latest TnC]');
  }

  // Found latest TnC
  return await response.json();
}
