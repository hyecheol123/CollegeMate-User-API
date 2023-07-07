/**
 * Jest unit test for PATCH /user/profile/{base64Email} method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import {Buffer} from 'node:buffer';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';

const USER = 'user';

describe('PATCH /user/profile/{base64Email} - Update User Profile', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    locked: '',
    deleted: '',
    lockedAndDeleted: '',
    recentNickname: '',
    oldNickname: '',
    wrong: '',
    expired: '',
    steve: '',
    drag: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create Access Token
    // locked Access Token
    // Token Content
    let tokenContent = {
      id: 'locked@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.locked = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Deleted Access Token
    // Token Content
    tokenContent = {
      id: 'deleted@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.deleted = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Locked and Deleted Access Token
    // Token Content
    tokenContent = {
      id: 'locked-deleted@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.lockedAndDeleted = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Recent Access Token
    // Token Content
    tokenContent = {
      id: 'recent@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.recentNickname = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Old Access Token
    // Token Content
    tokenContent = {
      id: 'old@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.oldNickname = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
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
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Expired Access Token
    // Token Content
    tokenContent = {id: 'expired@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.expired = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '1ms'}
    );

    // Steve Token
    tokenContent = {id: 'steve@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.steve = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Drag Token
    tokenContent = {id: 'drag@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.drag = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail -  Neither from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const email = 'steve@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };

    //request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const email = 'steve@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };

    //request without access token
    const response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Invalid Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const email = 'expired@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    const response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Invalid Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const email = 'steve@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    // Graduation Year out of range
    const wrongRange = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2029,
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(wrongRange);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Graduation not a number
    const wrongGraduation = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: '2025',
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(wrongGraduation);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // requestbody with additional property
    const additional = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
      additional: 'additional',
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(additional);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // no requestbody
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Wrong Email(Parameter) format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request From Web - All fields
    const wrongEmail = 'wrongFormat';
    const encodedEmail = Buffer.from(wrongEmail, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };
    const response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Email does not Match Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request From Web - All fields
    const wrongEmail = 'wrong@wisc.edu';
    const encodedEmail = Buffer.from(wrongEmail, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };
    const response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const wrongEmail = 'wrong@wisc.edu';
    const encodedEmail = Buffer.from(wrongEmail, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };
    //request with a wrong access token - refresh token
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request with a wrong access token
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - User Locked or Deleted', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // locked account check
    let email = 'locked@wisc.edu';
    let encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.locked})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    // DB Check
    let dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('locked@wisc.edu');
    expect(dbOps.resource.nickname).toBe('locked');
    expect(dbOps.resource.searchTerm).toBe('LOCKED');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);

    // deleted account check
    email = 'deleted@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.deleted})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    // DB Check
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('deleted@wisc.edu');
    expect(dbOps.resource.nickname).toBe('deleted');
    expect(dbOps.resource.searchTerm).toBe('DELETED');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);

    // locked and deleted account check
    email = 'locked-deleted@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.lockedAndDeleted})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    // DB Check
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('locked-deleted@wisc.edu');
    expect(dbOps.resource.nickname).toBe('locked&Deleted');
    expect(dbOps.resource.searchTerm).toBe('LOCKED&DELETED');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2022-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);
  });

  test('Fail - Nickname has been Changed within 30 days', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // create a user with nickname changed within 30 days
    const recentChange = new Date();
    recentChange.setDate(recentChange.getDate() - 29);

    await testEnv.dbClient.container('user').items.create({
      id: 'recent@wisc.edu',
      nickname: 'recent',
      searchTerm: 'RECENT',
      lastLogin: new Date().toISOString(),
      signUpDate: new Date().toISOString(),
      nicknameChanged: recentChange.toISOString(),
      deleted: false,
      locked: false,
      major: 'Animal Science',
      graduationYear: 2023,
      tncVersion: 'v1.0.2',
    });

    // nickname has been changed within 30 days
    const email = 'recent@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {nickname: 'unique'};
    const response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.recentNickname})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // DB Check
    const dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('recent@wisc.edu');
    expect(dbOps.resource.nickname).toBe('recent');
    expect(dbOps.resource.searchTerm).toBe('RECENT');
    expect(dbOps.resource.nicknameChanged).toBe(recentChange.toISOString());
    expect(dbOps.resource.major).toBe('Animal Science');
    expect(dbOps.resource.graduationYear).toBe(2023);
  });

  test('Fail - Invalid Nickname (Duplicate)', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // nickname is duplicate
    const email = 'steve@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestbody = {
      nickname: 'drag',
      major: 'Computer Science',
      graduationYear: 2024,
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestbody);
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    requestbody.nickname = 'locked';
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestbody);
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // DB Check
    const dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.nickname).toBe('steve');
    expect(dbOps.resource.searchTerm).toBe('STEVE');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);
  });

  test('Fail - Request Value does not Involve Changes', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // major has not been changed
    const email = 'steve@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const unchangedMajor = {
      major: 'Computer Science',
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(unchangedMajor);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // graduationYear has not been changed
    const unchangedGraduation = {
      graduationYear: 2024,
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(unchangedGraduation);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // major and graduationYear has not been changed
    const unchanged = {
      nickname: 'steve',
      major: 'Computer Science',
      graduationYear: 2024,
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(unchanged);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Major does not Exist', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Major does not exist
    const email = 'steve@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestbody = {
      nickname: 'unique',
      major: 'Agricultural Science',
      graduationYear: 2024,
    };
    const response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestbody);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // DB Check
    const dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.nickname).toBe('steve');
    expect(dbOps.resource.searchTerm).toBe('STEVE');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);
  });

  test('Success - Nickname Changed 31 days ago', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // create a user with nickname changed just over 30 days
    const oldChange = new Date();
    oldChange.setDate(oldChange.getDate() - 31);

    await testEnv.dbClient.container('user').items.create({
      id: 'old@wisc.edu',
      nickname: 'old',
      searchTerm: 'OLD',
      lastLogin: new Date().toISOString(),
      signUpDate: new Date().toISOString(),
      nicknameChanged: oldChange.toISOString(),
      deleted: false,
      locked: false,
      major: 'Chemistry',
      graduationYear: 2023,
      tncVersion: 'v1.0.2',
    });

    // nickname has been changed just over 30 days ago
    const email = 'old@wisc.edu';
    const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {
      nickname: 'rare',
      major: 'Computer Science',
      graduationYear: 2027,
    };
    const response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.oldNickname})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if all requested fields are updated
    const dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('old@wisc.edu');
    expect(dbOps.resource.nickname).toBe('rare');
    expect(dbOps.resource.searchTerm).toBe('RARE');
    expect(dbOps.resource.nicknameChanged).not.toBe(oldChange.toISOString());
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2027);
  });

  test('Success - All fields', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web - All fields
    let email = 'steve@wisc.edu';
    let encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    let requestBody = {
      nickname: 'unique',
      major: 'Animal Science',
      graduationYear: 2027,
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if all requested fields are updated
    let dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.nickname).toBe('unique');
    expect(dbOps.resource.searchTerm).toBe('UNIQUE');
    expect(dbOps.resource.nicknameChanged).not.toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Animal Science');
    expect(dbOps.resource.graduationYear).toBe(2027);

    // Request From app - All fields
    email = 'drag@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    requestBody = {
      nickname: 'different',
      major: 'Chemistry',
      graduationYear: 2027,
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if all requested fields are updated
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('drag@wisc.edu');
    expect(dbOps.resource.nickname).toBe('different');
    expect(dbOps.resource.searchTerm).toBe('DIFFERENT');
    expect(dbOps.resource.nicknameChanged).not.toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.major).toBe('Chemistry');
    expect(dbOps.resource.graduationYear).toBe(2027);
  });

  test('Success - Major', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web - Only Major
    let email = 'steve@wisc.edu';
    let encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const requestBody = {
      major: 'Animal Science',
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the major is changed
    let dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.major).toBe('Animal Science');
    // other fields should not be changed
    expect(dbOps.resource.nickname).toBe('steve');
    expect(dbOps.resource.searchTerm).toBe('STEVE');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.graduationYear).toBe(2024);

    // Request From app - Only Major changed and nickname is the same
    email = 'drag@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    const partialChange = {
      nickname: 'drag',
      major: 'Electrical Engineering',
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(partialChange);
    expect(response.status).toBe(200);

    // Check DB to see if the major is changed
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('drag@wisc.edu');
    expect(dbOps.resource.major).toBe('Electrical Engineering');
    // other fields should not be changed
    expect(dbOps.resource.nickname).toBe('drag');
    expect(dbOps.resource.searchTerm).toBe('DRAG');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(dbOps.resource.graduationYear).toBe(2024);
  });

  test('Success - Graduation Year', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web - Only Graduation Year
    let email = 'steve@wisc.edu';
    let encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    let requestBody = {
      graduationYear: 2022,
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the graduationYear is changed
    let dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.graduationYear).toBe(2022);
    // other fields should not be changed
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.nickname).toBe('steve');
    expect(dbOps.resource.searchTerm).toBe('STEVE');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );

    // Request From app - Only Graduation Year
    email = 'drag@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    requestBody = {
      graduationYear: 2026,
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the graduationYear is changed
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('drag@wisc.edu');
    expect(dbOps.resource.graduationYear).toBe(2026);
    // other fields should not be changed
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.nickname).toBe('drag');
    expect(dbOps.resource.searchTerm).toBe('DRAG');
    expect(dbOps.resource.nicknameChanged).toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
  });

  test('Success - Only Nickname', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web - Only Nickname (Valid)
    let email = 'steve@wisc.edu';
    let encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    let requestBody = {
      nickname: 'unique',
    };
    let response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the nickname is changed
    let dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.nickname).toBe('unique');
    expect(dbOps.resource.searchTerm).toBe('UNIQUE');
    expect(dbOps.resource.nicknameChanged).not.toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    // other fields should not be changed
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);

    // Request From app - Only Nickname (Valid)
    email = 'drag@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    requestBody = {
      nickname: 'different',
    };
    response = await request(testEnv.expressServer.app)
      .patch(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the nickname is changed
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.id).toBe('drag@wisc.edu');
    expect(dbOps.resource.nickname).toBe('different');
    expect(dbOps.resource.searchTerm).toBe('DIFFERENT');
    expect(dbOps.resource.nicknameChanged).not.toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    // other fields should not be changed
    expect(dbOps.resource.major).toBe('Computer Science');
    expect(dbOps.resource.graduationYear).toBe(2024);
  });
});
