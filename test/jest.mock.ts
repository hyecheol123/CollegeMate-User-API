/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@wisc.edu>
 */

// Mocking Email Sending Module
jest.mock('../src/functions/utils/sendLockEmail', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => Promise.resolve()),
  }));

// Mocking Notification Sending Module
jest.mock('../src/functions/utils/sendLockNotification', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve()),
}));