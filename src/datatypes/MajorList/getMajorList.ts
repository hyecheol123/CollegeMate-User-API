/**
 * Function to retrieve most recent major list from Miscellaneous API
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import {Request} from 'express';
import MajorList from './MajorList';

/**
 * Function to retrieve most recent major list from Miscellaneous API
 *
 * @param {Request} req express Request object
 * @param {string} schoolDomain school domain
 * @return {Promise<MajorList>} MajorList
 */
export default async function getTnC(
  req: Request,
  schoolDomain: string
): Promise<MajorList> {
  const response = await fetch('https://api.collegemate.app/majorlist', {
    method: 'GET',
    headers: {'X-APPLICATION-KEY': req.app.get('serverApplicationKey')},
    body: JSON.stringify({schoolDomain: schoolDomain}),
  });

  if (response.status !== 200) {
    throw new Error('[Fail on retreiving Major List]');
  }

  return await response.json();
}
