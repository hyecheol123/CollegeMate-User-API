/**
 * Define type for IUserUpdateObj
 * - nickname: nickname of the user
 * - nicknameChanged: date when the nickname was changed
 * - major: major of the user
 * - graduationYear: graduation year of the user
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

/**
 * Interface for IUserUpdateObj
 */
export default interface IUserUpdateObj {
  nickname?: string;
  major?: string;
  graduationYear?: number;
}
