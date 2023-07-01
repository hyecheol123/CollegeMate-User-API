/**
 * Jest unit test for PATCH /user/profile/{base64id} method
 *
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

const USER = 'user';

describe('PATCH /user/profile/{base64id} - Update User Profile', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
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
    // Wrong Access Token
    // Token Content
    let tokenContent = {
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

  test('Fail - ', async () => {
    fail();
  });

  test('Fail - ', async () => {
    fail();
  });

  test('Fail - ', async () => {
    fail();
  });

  test('Success - All fields', async () => {
    fail();
  });

  test('Success - Major', async () => {
    fail();
  });

  test('Success - Graduation Year', async () => {
    fail();
  });

  test('Success - Nickname', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web - Only Nickname (Valid)
    let email = 'steve@wisc.edu';
    let encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    let requestBody = {
      nickname: 'unique',
    };
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the nickname is changed
    let dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.email).toBe('steve@wisc.edu');
    expect(dbOps.resource.nickname).toBe('unique');
    expect(dbOps.resource.nicknameChanged).not.toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );

    // Request From app - Only Nickname (Valid)
    email = 'drag@wisc.edu';
    encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
    requestBody = {
      nickname: 'different',
    };
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(requestBody);
    expect(response.status).toBe(200);

    // Check DB to see if the nickname is changed
    dbOps = await testEnv.dbClient.container(USER).item(email).read();
    expect(dbOps.statusCode !== 404).toBe(true);
    expect(dbOps.resource.email).toBe('drag@wisc.edu');
    expect(dbOps.resource.nickname).toBe('different');
    expect(dbOps.resource.nicknameChanged).not.toBe(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
  });
});
