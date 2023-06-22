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
 * @param {string} requestUserStatus - relationship between request user and target user
 */
export default function formatUserProfileResponseObj(
  user: User,
  requestUserStatus: string
): UserProfileResponseObj {
  const userProfileResponseObj: UserProfileResponseObj = {
    nickname: user.nickname,
    major: user.major,
    graduationYear: user.graduationYear,
  };

  if (requestUserStatus === 'serverAdmin') {
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
  } else if (requestUserStatus === 'self') {
    userProfileResponseObj.lastLogin = user.lastLogin;
    userProfileResponseObj.nicknameChanged = user.nicknameChanged;
  }

  return userProfileResponseObj;
}
