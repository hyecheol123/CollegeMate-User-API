/**
 * File to execute when jest test environmet is started.
 * Mocking getTnC() function to return mock TnC data.
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// TnC Mock Data
jest.mock('../src/datatypes/TermsAndCondition/getTnC', () => ({
  __esModule: true,
  default: jest.fn(async () => {
    return {
      version: '1.0.0',
      createdAt: '2020-01-01T00:00:01.002Z',
      content: 'This is mock TnC content',
    };
  }),
}));
