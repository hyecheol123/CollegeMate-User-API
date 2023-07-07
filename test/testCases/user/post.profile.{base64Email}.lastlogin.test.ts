/**
 * Jest unit test for POST / profile / {base64Email} / lastlogin method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import {Buffer} from 'node:buffer';
import TestEnv from '../../TestEnv';
import * as Cosmos from '@azure/cosmos';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';

describe('POST/ profile/ {base64Email}/ lastlogin - Update Last Login (Authentication Server Use Only)', () => {
  let testEnv: TestEnv;

  const accessTokenMap = {
    refreshToken: '',
    adminToken: '',
    missingAccountType: '',
    valid: '',
    user: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    //valid authentication server token
    let tokenContent: AuthToken = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'server - authentication',
    };
    accessTokenMap.valid = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    //serverAdmin Token
    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    accessTokenMap.adminToken = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );

    //missing AccountType Token
    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
    };
    accessTokenMap.missingAccountType = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );

    //Refresh Token
    tokenContent = {
      id: 'testAdmin',
      type: 'refresh',
      tokenType: 'serverAdmin',
      accountType: 'server - authentication',
    };
    accessTokenMap.refreshToken = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );

    // User Token
    tokenContent = {
      id: 'steve@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.user = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Request without ServerAdminToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request without any token
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app).post(
      `/user/profile/${encodedEmail}/lastlogin`
    );
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');

    // Request without X-Server-Token
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-OTHER-TOKEN': '<Some-Other-Value>'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Request with invalid ServerAdminToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.missingAccountType});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.user});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.refreshToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.adminToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - ServerAdminToken expired', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Generate token
    const tokenContent: AuthToken = {
      id: 'steve@wisc.edu',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'server - authentication',
    };
    const token = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '1ms',
    });

    // Wait for 20 ms
    await new Promise(resolve => setTimeout(resolve, 20));

    // Request
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  // user.ts line 234 체크하는데..?
  test('Fail - Not existing id', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request
    const invalidEmail = Buffer.from('doesnotExist@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${invalidEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // check if it is updated in the database
    const dbOps = await testEnv.dbClient
      .container('user')
      .item('doesnotExist@wisc.edu')
      .read();
    // user.ts line 272 체크해볼려는데 모르겠음..
    expect(dbOps.statusCode).toBe(404);
    expect(dbOps.resource).toBe(undefined);
  });

  test('Fail - Bad Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with invalid request body
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({invalidProperty: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - User Locked or/and Deleted', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const lockedEmail = Buffer.from('locked@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${lockedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Request
    const deletedEmail = Buffer.from('deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${deletedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Request
    const lockedAndDeleted = Buffer.from(
      'locked-deleted@wisc.edu',
      'utf8'
    ).toString('base64url');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${lockedAndDeleted}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Success - Post lastLogin', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request to lock the user profile
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(200);

    // check if it is updated in the database
    const dbOps = await testEnv.dbClient
      .container('user')
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.resource.lastLogin).toContain('2023-05-31T14:48:00.000Z');
    expect(dbOps.resource.deleted).toBe(false);
    expect(dbOps.resource.locked).toBe(false);
    expect(dbOps.resource).not.toHaveProperty('lockedDescription');
    expect(dbOps.resource).not.toHaveProperty('lockedAt');
    expect(dbOps.resource).not.toHaveProperty('deletedAt');

    // expect(new Date(response.body.lastLogin).toISOString()).toEqual(
    //     new Date('2023-05-31T14:48:00.000Z').toISOString());
  });
});
