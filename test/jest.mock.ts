/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import OTP from '../src/datatypes/OTP/OTP';
import NotFoundError from '../src/exceptions/NotFoundError';

// TnC Mock Data
jest.mock('../src/datatypes/TNC/getTnC', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: jest.fn(async (_req: Request) => {
    return {
      version: 'v1.0.2',
      createdAt: new Date('2022-03-01T00:50:43.000Z').toISOString(),
      content: 'test',
    };
  }),
}));

// Major List Mock Data
jest.mock('../src/datatypes/MajorList/getMajorList', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: jest.fn(async (_req: Request, schoolDomain: string) => {
    return {
      majorList: [
        'Animal Science',
        'Computer Science',
        'Chemistry',
        'Electrical Engineering',
        'Physics',
        'Mathematics',
        'Biology',
        'Economics',
        'Psychology',
        'English',
        'History',
        'Sociology',
      ].sort(),
    };
  }),
}));

// OTP Mock Data
jest.mock('../src/datatypes/OTP/verifyOTPRequest', () => ({
  __esModule: true,
  default: jest
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .fn(async (requestID: string, _req: Request) => {
      let returnValue: OTP;
      // 15 minutes from now
      const validExpireAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      switch (requestID) {
        case 'signinotp':
          returnValue = {
            email: 'steve@wisc.edu',
            purpose: 'signin',
            verified: true,
            expireAt: validExpireAt,
          };
          return returnValue;
        case 'expiredotp':
          returnValue = {
            email: 'steve@wisc.edu',
            purpose: 'sudo',
            verified: true,
            expireAt: new Date('2022-03-01T00:50:43.000Z').toISOString(),
          };
          return returnValue;
        case 'unverifiedotp':
          returnValue = {
            email: 'steve@wisc.edu',
            purpose: 'sudo',
            verified: false,
          };
          return returnValue;
        case 'steveotp':
          returnValue = {
            email: 'steve@wisc.edu',
            purpose: 'sudo',
            verified: true,
            expireAt: validExpireAt,
          };
          return returnValue;
        case 'dragotp':
          returnValue = {
            email: 'drag@wisc.edu',
            purpose: 'sudo',
            verified: true,
            expireAt: validExpireAt,
          };
          return returnValue;
        case 'lockedotp':
          returnValue = {
            email: 'locked@wisc.edu',
            purpose: 'sudo',
            verified: true,
            expireAt: validExpireAt,
          };
          return returnValue;
        case 'deletedotp':
          returnValue = {
            email: 'deleted@wisc.edu',
            purpose: 'sudo',
            verified: true,
            expireAt: validExpireAt,
          };
          return returnValue;
        default:
          throw new NotFoundError();
      }
    }),
}));
