/**
 * Define type of One Time Password (OTP) Response
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

export default interface OTPResponse {
  email: string;
  purpose: string;
  verified: boolean;
  expireAt?: Date | string;
}
