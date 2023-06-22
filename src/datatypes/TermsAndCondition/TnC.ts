/**
 * Define type of Terms and Conditions
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com
 */

export default interface TnC {
  version: string;
  createdAt: Date | string;
  content: string;
}
