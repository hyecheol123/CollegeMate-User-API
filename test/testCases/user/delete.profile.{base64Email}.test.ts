/**
 * Jest unit test for Delete /user/profile/{base64Email} method
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

describe('DELETE /user/profile/{base64Email} - Delete User Profile', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    valid: '',
    wrong: '',
    expired: '',
    steve: '',
    drag: '',
    locked: '',
    deleted: '',
  };
  const requestIdMap = {
    steve: '',
    drag: '',
    locked: '',
    deleted: '',
    unverified: '',
    expired: '',
    signin: '',
  };
  const encodedEmailMap = {
    steve: '',
    drag: '',
    locked: '',
    deleted: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create Mocked OTP Request Map
    requestIdMap.steve = 'steveotp';
    requestIdMap.drag = 'dragotp';
    requestIdMap.locked = 'lockedotp';
    requestIdMap.deleted = 'deletedotp';
    requestIdMap.unverified = 'unverifiedotp';
    requestIdMap.expired = 'expiredotp';
    requestIdMap.signin = 'signinotp';

    // Create Test Encoded Emails
    encodedEmailMap.steve = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );

    encodedEmailMap.drag = Buffer.from('drag@wisc.edu', 'utf8').toString(
      'base64url'
    );

    encodedEmailMap.locked = Buffer.from('locked@wisc.edu', 'utf8').toString(
      'base64url'
    );

    encodedEmailMap.deleted = Buffer.from('deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );

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
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Wrong Access Token
    // Token Content
    tokenContent = {id: 'wrong@wisc.edu', type: 'refresh', tokenType: 'user'};
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
    // Token Content
    tokenContent = {id: 'steve@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.steve = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Drag Token
    // Token Content
    tokenContent = {id: 'drag@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.drag = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // locked self Token
    tokenContent = {id: 'locked@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.locked = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Deleted self Token
    tokenContent = {id: 'deleted@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.deleted = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Neither From Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with No Origin or App
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Wrong Origin
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.com'})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Wrong App
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrong'})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Expired, Wrong or No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with Expired Access Token
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Wrong Access Token
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with No Access Token
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Wrong Email Format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const invalidEmail = Buffer.from('wrong', 'utf8').toString('base64url');
    // Request with Invalid Email
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${invalidEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // Request with Unencoded Email
    response = await request(testEnv.expressServer.app)
      .delete('/user/profile/steve@wisc.edu')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Unmatching Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with Unmatching Email
    const response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Additional or No Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with No Request Body
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with Additional Request Body
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.steve, additional: 'additional'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with Wrong Request Body
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({wrong: 'wrong'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Non-Existent OTP Request ID', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Non-Existent OTP Request ID
    const response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: 'doesnotexist'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Wrong and Unverified OTP Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // OTP Request with different email
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.drag});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Not Verified OTP Request
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.unverified});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Expired OTP Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Expired OTP Request
    const response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.expired});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Already Deleted or Locked User', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Locked Account
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.locked}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.locked})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.locked});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Deleted Account
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.deleted}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.deleted})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.deleted});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - OTP Request with Wrong Purpose', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // OTP Request with Wrong Purpose
    const response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.signin});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // From Web
    // Delete Steve
    let response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({otpRequestId: requestIdMap.steve});
    expect(response.status).toBe(200);

    // Cookie Clear Check
    let cookie = response.header['set-cookie'][0].split('; ')[0].split('=');
    expect(cookie[0]).toBe('X-ACCESS-TOKEN'); // Check for Access Token Name
    expect(cookie[1]).toBe('');
    cookie = response.header['set-cookie'][1].split('; ')[0].split('=');
    expect(cookie[0]).toBe('X-REFRESH-TOKEN'); // check for Refresh Token Name
    expect(cookie[1]).toBe('');

    // DB Check
    let dbOps = await testEnv.dbClient
      .container(USER)
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.statusCode).not.toBe(404);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.deleted).toBe(true);
    expect(dbOps.resource.deletedAt).not.toBeUndefined();
    expect(dbOps.resource.locked).toBe(false);

    // From App
    // Delete Drag
    response = await request(testEnv.expressServer.app)
      .delete(`/user/profile/${encodedEmailMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({otpRequestId: requestIdMap.drag});
    expect(response.status).toBe(200);

    // Cookie Clear Check
    cookie = response.header['set-cookie'][0].split('; ')[0].split('=');
    expect(cookie[0]).toBe('X-ACCESS-TOKEN'); // Check for Access Token Name
    expect(cookie[1]).toBe('');
    cookie = response.header['set-cookie'][1].split('; ')[0].split('=');
    expect(cookie[0]).toBe('X-REFRESH-TOKEN'); // check for Refresh Token Name
    expect(cookie[1]).toBe('');

    // DB Check
    dbOps = await testEnv.dbClient.container(USER).item('drag@wisc.edu').read();
    expect(dbOps.statusCode).not.toBe(404);
    expect(dbOps.resource.id).toBe('drag@wisc.edu');
    expect(dbOps.resource.deleted).toBe(true);
    expect(dbOps.resource.deletedAt).not.toBeUndefined();
    expect(dbOps.resource.locked).toBe(false);
  });
});
