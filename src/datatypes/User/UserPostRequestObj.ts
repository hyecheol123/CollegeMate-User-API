/**
 * Define type for UserPostRequestObj
 * - id: email of the user
 * - nickname: nickname of the user
 * - major: major of the user
 * - graduationYear: graduation year of the user
 * - tncVersion: terms and conditions version of the user
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

/**
 * Interface for UserPostRequestObj
 */
export default interface UserPostRequestObj {
  id: string;
  nickname: string;
  major: string;
  graduationYear: number;
  tncVersion: string;
}
