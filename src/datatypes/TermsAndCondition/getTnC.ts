/**
 * Function to retrieve latest Terms and Conditions from Terms and Conditions API
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import TnC from './TnC';
import NotFoundError from '../../exceptions/NotFoundError';

/**
 * Function to retrieve latest TnC from Terms and Conditions API
 *
 * @return {Promise<User>} User Profile
 */
export default async function getUserProfile(): Promise<TnC> {
  const response = await fetch('https://api.collegemate.app/tnc', {
    method: 'GET',
    headers: {'X-APPLICATION-KEY': '<API-Servers>'},
  });

  if (response.status === 403) {
    throw new Error('[Fail on retreiving latest TnC : API Key not allowed]');
  }

  if (response.status === 404) {
    // TnC not found
    throw new NotFoundError();
  }

  if (response.status !== 200) {
    throw new Error('[Fail on retreiving latest TnC]');
  }

  // Found latest TnC
  const latestTnC = await response.json();
  return {
    version: latestTnC.version,
    createdAt: latestTnC.createdAt,
    content: latestTnC.content,
  };
}
