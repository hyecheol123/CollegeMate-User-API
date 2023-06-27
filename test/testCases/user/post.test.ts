/**
 * Jest unit test for POST /user
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import {Buffer} from 'node:buffer';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import UserPostRequestObj from '../../../src/datatypes/User/UserPostRequestObj';

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
      tncVersion: 'v1.0.2',
    };
    userReq.email = Buffer.from(userReq.email, 'utf8').toString('base64url');
    userMap.valid = userReq;
    // Wrong Email User
    userReq = {
      email: 'wrong@wisc.edu',
      nickname: 'jeonghyun',
      major: 'Animal Science',
      graduationYear: 2024,
      tncVersion: 'v1.0.2',
    };
    userReq.email = Buffer.from(userReq.email, 'utf8').toString('base64url');
    userMap.wrongEmail = userReq;
    // Wrong TnC User
    userReq = {
      email: 'user@wisc.edu',
      nickname: 'daekyun',
      major: 'Electrical Engineering',
      graduationYear: 2023,
      tncVersion: 'v1.0.0',
    };
    userReq.email = Buffer.from(userReq.email, 'utf8').toString('base64url');
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
    expect(response.body.error).toBe('Forbidden');

    // No Application Key or Origin
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .send(userMap.valid);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Wrong Origin
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://suspicious.app'})
      .send(userMap.valid);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // No Access Token
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
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
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wrong Token - Refresh Token as Access Token
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Additional or No or Wrong Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // No Request Body
    let response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Extra Request Body
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({
        id: userMap.valid.email,
        nickname: userMap.valid.nickname,
        major: userMap.valid.major,
        graduationYear: userMap.valid.graduationYear,
        tncVersion: userMap.valid.tncVersion,
        extra: 'extra',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request Body with some wrong properties
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({
        id: userMap.valid.email,
        major: userMap.valid.major,
        graduationYear: userMap.valid.graduationYear,
        tncVersion: userMap.valid.tncVersion,
        extra: 'extra',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request Body with all wrong properties
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({
        extra: 'extra',
        property: 'property',
        wrong: 'wrong',
        type: 'type',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request Body with some properties missing
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({
        id: userMap.valid.email,
        nickname: userMap.valid.nickname,
        major: userMap.valid.major,
        tncVersion: userMap.valid.tncVersion,
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // RequestBody with invalid graduationYear
    const reqBody = {
      id: userMap.valid.email,
      nickname: userMap.valid.nickname,
      major: userMap.valid.major,
      graduationYear: 2500, // Invalid graduationYear too high
      tncVersion: userMap.valid.tncVersion,
    };
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(reqBody);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    reqBody.graduationYear = 2000; // Invalid graduationYear too low
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(reqBody);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request Body with invalid email
    response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({
        email: 'not an email',
        nickname: userMap.valid.nickname,
        major: userMap.valid.major,
        tncVersion: userMap.valid.tncVersion,
        graduationYear: 2024,
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Different Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Different Email from Token and Request Body
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.wrongEmail);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
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
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Nickname Not Available', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    userMap.valid.nickname = 'steve';
    const response = await request(testEnv.expressServer.app)
      .post('/user')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(userMap.valid);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
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

    const email = Buffer.from(userMap.valid.email, 'base64url').toString(
      'utf8'
    );
    // Check if user is created in database
    const dbQuery = await testEnv.dbClient
      .container('user')
      .items.query({
        query: `SELECT * FROM user WHERE user.id = '${email}'`,
      })
      .fetchAll();
    expect(dbQuery.resources.length).toBe(1);
    expect(dbQuery.resources[0].id).toBe(email);
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

    const email = Buffer.from(userMap.valid.email, 'base64url').toString(
      'utf8'
    );
    // Check if user is created in database
    const dbQuery = await testEnv.dbClient
      .container('user')
      .items.query({
        query: `SELECT * FROM user WHERE user.id = '${email}'`,
      })
      .fetchAll();
    expect(dbQuery.resources.length).toBe(1);
    expect(dbQuery.resources[0].id).toBe(email);
    expect(dbQuery.resources[0].nickname).toBe(userMap.valid.nickname);
    expect(dbQuery.resources[0].major).toBe(userMap.valid.major);
    expect(dbQuery.resources[0].graduationYear).toBe(
      userMap.valid.graduationYear
    );
    expect(dbQuery.resources[0].tncVersion).toBe(userMap.valid.tncVersion);
  });
});
