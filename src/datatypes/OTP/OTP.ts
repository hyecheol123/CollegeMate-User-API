/**
 * Define type of One Time Password (OTP)
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

export default interface OTP {
  email: string;
  purpose: string;
  verified: boolean;
  expireAt?: Date | string;
}
