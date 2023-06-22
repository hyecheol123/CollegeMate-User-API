/**
 * Jest unit test for GET /user/{base64Email} method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import User from '../../../src/datatypes/User/User';
import AuthToken from '../../../src/datatypes/Token/AuthToken';

describe('GET /user/profile/{base64Email} - Get User Profile', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    valid: '',
    wrong: '',
    expired: '',
  };
  const userMap = {
    steve: {} as User,
    drag: {} as User,
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Enter Test Data into Database
    // Create Users
    let user = new User(
      'steve@wisc.edu',
      'steve',
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      false,
      undefined,
      false,
      undefined,
      undefined,
      'Computer Science',
      2024,
      '1.0.0'
    );
    await testEnv.dbClient.container('user').items.create(user);
    userMap.steve = user;
    user = new User(
      'drag@wisc.edu',
      'drag',
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      false,
      undefined,
      false,
      undefined,
      undefined,
      'Computer Science',
      2024,
      '1.0.0'
    );
    await testEnv.dbClient.container('user').items.create(user);
    userMap.drag = user;

    // Create Access Token
    // Valid Access Token
    let tokenContent: AuthToken = {
      id: 'user@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.valid = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    // Wrong Access Token
    // Token Content
    tokenContent = {
      id: 'wrong@wisc.edu',
      type: 'refresh',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.wrong = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    // Expired Access Token
    // Token Content
    tokenContent = {
      id: 'expired@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.expired = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '1ms',
      }
    );
  });

  // TODO: More token with self, other user, admin, etc. needs to be created to be tested

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Neither Admin or from Origin nor App', async () => {
    fail();
  });

  test('Fail - No Access nor Admin Token', async () => {
    fail();
  });

  test('Fail - Expired Access or Admin Token', async () => {
    fail();
  });

  test('Fail - Wrong Token', async () => {
    // Test Admin with Wrong Token, Wrong Access Token and more if you think of it
    fail();
  });

  test('Fail - Email not found', async () => {
    fail();
  });

  test('Success - Admin', async () => {
    fail();
  });

  test('Success - Self Request', async () => {
    fail();
  });

  test.only('Success - Other Users Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    const response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('nicknameChanged');

    // Request From App
    // MORE TESTS TO BE WRITTEN BELOW
  });
});
