/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

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

// Mocking Email Sending Module
jest.mock('../src/functions/utils/sendLockMail', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve()),
}));
