/**
 * Define type for user profile response object
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

export default interface UserProfileResponseObj {
  nickname: string;
  lastLogin?: string;
  signUpDate?: string;
  nicknameChanged?: string;
  deleted?: boolean;
  deletedAt?: string;
  locked?: boolean;
  lockedDescription?: string;
  lockedAt?: string;
  major: string;
  graduationYear: number;
  tncVersion?: string;
}
