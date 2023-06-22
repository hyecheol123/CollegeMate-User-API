/**
 * Format user profile response object
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import User from '../../datatypes/User/User';
import UserProfileResponseObj from '../../datatypes/User/UserProfileResponseObj';

/**
 * Method to format user profile response object
 *
 * @param {User} user - user object
 * @param {boolean} isServerAdmin - whether the user is server admin or not
 */
export default function formatUserProfileResponseObj(
  user: User,
  isServerAdmin: boolean
): UserProfileResponseObj {
  const userProfileResponseObj: UserProfileResponseObj = {
    nickname: user.nickname,
    major: user.major,
    graduationYear: user.graduationYear,
  };

  if (isServerAdmin) {
    userProfileResponseObj.lastLogin = user.lastLogin;
    userProfileResponseObj.signUpDate = user.signUpDate;
    userProfileResponseObj.nicknameChanged = user.nicknameChanged;
    userProfileResponseObj.deleted = user.deleted;
    if (user.deletedAt) {
      userProfileResponseObj.deletedAt = user.deletedAt;
    }
    userProfileResponseObj.locked = user.locked;
    if (user.locked) {
      userProfileResponseObj.lockedDescription = user.lockedDescription;
      userProfileResponseObj.lockedAt = user.lockedAt;
    }
    userProfileResponseObj.tncVersion = user.tncVersion;
  }

  return userProfileResponseObj;
}
