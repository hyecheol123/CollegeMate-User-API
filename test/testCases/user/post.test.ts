/**
 * Jest unit test for POST /user
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import UserPostRequestObj from '../../../src/datatypes/User/UserPostRequestObj';
import User from '../../../src/datatypes/User/User';

describe('POST /user - Create User', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    valid: '',
    wrong: '',
    expired: '',
  };
  const userMap = {
    valid: {} as UserPostRequestObj,
    wrongEmail: {} as UserPostRequestObj,
    wrongTnC: {} as UserPostRequestObj,
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create Access Token
    // Valid Access Token
    const signOptions: jwt.SignOptions = {
      algorithm: 'HS512',
      expiresIn: '10m',
    };

    let tokenContent: AuthToken = {
      id: 'user@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.valid = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      signOptions
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
      signOptions
    );

    // Expired Access Token
    // Token Content
    tokenContent = {
      id: 'expired@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    signOptions.expiresIn = '1ms';
    accessTokenMap.expired = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      signOptions
    );

    // Create User
    // Valid User
    let userReq: UserPostRequestObj = {
      email: 'user@wisc.edu',
      nickname: 'jerry',
      major: 'Computer Science',
      graduationYear: 2023,
      tncVersion: '1.0.0',
    };
    userMap.valid = userReq;
    // Wrong Email User
    userReq = {
      email: 'wrong@wisc.edu',
      nickname: 'jeonghyun',
      major: 'Animal Science',
      graduationYear: 2024,
      tncVersion: '1.0.0',
    };
    userMap.wrongEmail = userReq;
    // Wrong TnC User
    userReq = {
      email: 'user@wisc.edu',
      nickname: 'daekyun',
      major: 'Electrical Engineering',
      graduationYear: 2023,
      tncVersion: '1.0.2',
    };
    userMap.wrongTnC = userReq;
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No Application Key and Not Origin', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wrong Application Key
    let response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Wrong>'})
      .send(userMap.valid);
    expect(response.status).toBe(403);

    // No Application Key or Origin
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .send(userMap.valid);
    expect(response.status).toBe(403);

    // No Application Key and Wrong Origin
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://suspicious.app'})
      .send(userMap.valid);
    expect(response.status).toBe(403);
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // No Access Token
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(401);
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 10 ms to expire access token
    await new Promise(resolve => setTimeout(resolve, 10));

    // Expired Access Token
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(403);
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Wrong Token - Refresh Token as Access Token
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(403);
  });

  test('Fail - Additional or No or Wrong Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // No Request Body
    let response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(400);

    // Extra Request Body
    const extraReqBody = {
      email: userMap.valid.email,
      nickname: userMap.valid.nickname,
      major: userMap.valid.major,
      graduationYear: userMap.valid.graduationYear,
      tncVersion: userMap.valid.tncVersion,
      extra: 'extra',
    };
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(extraReqBody);
    expect(response.status).toBe(400);

    // Request Body with some wrong properties
    const extraReqBody1 = {
      email: userMap.valid.email,
      major: userMap.valid.major,
      graduationYear: userMap.valid.graduationYear,
      tncVersion: userMap.valid.tncVersion,
      extra: 'extra',
    };
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(extraReqBody1);
    expect(response.status).toBe(400);

    // Request Body with all wrong properties
    const missingReqBody = {
      extra: 'extra',
      property: 'property',
      wrong: 'wrong',
      type: 'type',
    };
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(missingReqBody);
    expect(response.status).toBe(400);

    // Request Body with some properties missing
    let reqBody = {
      email: userMap.valid.email,
      nickname: userMap.valid.nickname,
      major: userMap.valid.major,
      graduationYear: '',
      tncVersion: userMap.valid.tncVersion,
    };
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(reqBody);
    expect(response.status).toBe(400);

    // RequestBody with invalid graduationYear
    reqBody = {
      email: userMap.valid.email,
      nickname: userMap.valid.nickname,
      major: userMap.valid.major,
      graduationYear: '2500', // Invalid graduationYear too high
      tncVersion: userMap.valid.tncVersion,
    };
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(reqBody);
    expect(response.status).toBe(400);

    reqBody.graduationYear = '2000'; // Invalid graduationYear too low
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(reqBody);
    expect(response.status).toBe(400);
  });

  test('Fail - Different Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Different Email from Token and Request Body
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.wrongEmail);
    expect(response.status).toBe(403);
  });

  test('Fail - Wrong TnC', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Wrong TnC
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.wrongTnC);
    expect(response.status).toBe(409);
  });

  test('Fail - Nickname Not Available', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create a new user with the same nickname
    const user = new User(
      'steve@wisc.edu',
      'jerry',
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
      '0.0.1'
    );
    await testEnv.dbClient.container('user').items.create(user);

    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(400);
  });

  test('Success - App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create valid user - App
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(201);

    // Check if user is created in database
    const dbQuery = await testEnv.dbClient
      .container('user')
      .items.query({
        query: `SELECT * FROM user WHERE user.email = '${userMap.valid.email}'`,
      })
      .fetchAll();
    expect(dbQuery.resources.length).toBe(1);
    expect(dbQuery.resources[0].email).toBe(userMap.valid.email);
    expect(dbQuery.resources[0].nickname).toBe(userMap.valid.nickname);
    expect(dbQuery.resources[0].major).toBe(userMap.valid.major);
    expect(dbQuery.resources[0].graduationYear).toBe(
      userMap.valid.graduationYear
    );
    expect(dbQuery.resources[0].tncVersion).toBe(userMap.valid.tncVersion);
  });

  test('Success - Web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create valid user - Web
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send(userMap.valid);
    expect(response.status).toBe(201);

    // Check if user is created in database
    const dbQuery = await testEnv.dbClient
      .container('user')
      .items.query({
        query: `SELECT * FROM user WHERE user.email = '${userMap.valid.email}'`,
      })
      .fetchAll();
    expect(dbQuery.resources.length).toBe(1);
    expect(dbQuery.resources[0].email).toBe(userMap.valid.email);
    expect(dbQuery.resources[0].nickname).toBe(userMap.valid.nickname);
    expect(dbQuery.resources[0].major).toBe(userMap.valid.major);
    expect(dbQuery.resources[0].graduationYear).toBe(
      userMap.valid.graduationYear
    );
    expect(dbQuery.resources[0].tncVersion).toBe(userMap.valid.tncVersion);
  });
});
