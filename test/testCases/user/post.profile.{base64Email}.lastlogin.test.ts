/**
 * Jest unit test for POST/profile/{base64Email}/lastlogin method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import {Buffer} from 'node:buffer';
import TestEnv from '../../TestEnv';
import * as Cosmos from '@azure/cosmos';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';

describe('POST /profile/{base64Email}/lastlogin - Update Last Login (Authentication Server Use Only)', () => {
  let testEnv: TestEnv;

  const serverTokenMap = {
    refreshToken: '',
    nonAuth: '',
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
    serverTokenMap.valid = jwt.sign(
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
    serverTokenMap.nonAuth = jwt.sign(
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
    serverTokenMap.missingAccountType = jwt.sign(
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
    serverTokenMap.refreshToken = jwt.sign(
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
    serverTokenMap.user = jwt.sign(
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
      .set({'X-OTHER-TOKEN': '<Some-Other-Value>'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Request with invalid ServerAdminToken(nonAuth)', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with token missing accountType
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.missingAccountType});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with user access token
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.user});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with wrong token type
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.refreshToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request from non-authentication server
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.nonAuth});
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

  test('Fail - Wrong Email Format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const wrongEmail = Buffer.from('WrongEmailType', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${wrongEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Non-Existent Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const invalidEmail = Buffer.from('invalidEmail@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${invalidEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Invalid, Additional, or No Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with invalid request body
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({invalidProperty: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with invalid request body
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
        invalidProperty: 'invalidValue',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with invalid request body
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({invalidProperty: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with correct property name with non ISO datetime string
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with correct property name with invalid ISO datetime string
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-05-31T24:48:00.000Z'}); // Invalid hour
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-05-31T14:61:00.000Z'}); // Invalid minute
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-05-31T14:51:99.000Z'}); // Invalid second
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-13-31T14:51:31.000Z'}); // Invalid month
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-00-31T14:51:00.000Z'}); // Invalid month
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2024-02-30T14:51:00.000Z'}); // Invalid date, leap
    expect(response.status).toBe(400);
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-02-29T14:51:00.000Z'}); // Invalid date, non leap
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-03-32T14:51:00.000Z'}); // Invalid date, non leap
    expect(response.status).toBe(400);
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-03-00T14:51:00.000Z'}); // Invalid date, non leap
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2023-09-31T14:51:00.000Z'}); // Invalid date, non leap
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({lastLogin: '2100-02-29T14:51:00.000Z'}); // Invalid date, non leap
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
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
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
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
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
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request to lock the user profile
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2023-05-31T14:48:00.000Z',
      });
    expect(response.status).toBe(200);
    // check if it is updated in the database
    let dbOps = await testEnv.dbClient
      .container('user')
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.resource.lastLogin).toContain('2023-05-31T14:48:00.000Z');
    expect(dbOps.resource.deleted).toBe(false);
    expect(dbOps.resource.locked).toBe(false);
    expect(dbOps.resource).not.toHaveProperty('lockedDescription');
    expect(dbOps.resource).not.toHaveProperty('lockedAt');
    expect(dbOps.resource).not.toHaveProperty('deletedAt');

    // Leap Year: 2020
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2020-02-29T14:48:00.000Z',
      });
    expect(response.status).toBe(200);
    // check if it is updated in the database
    dbOps = await testEnv.dbClient
      .container('user')
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.resource.lastLogin).toBe('2020-02-29T14:48:00.000Z');
    expect(dbOps.resource.deleted).toBe(false);
    expect(dbOps.resource.locked).toBe(false);
    expect(dbOps.resource).not.toHaveProperty('lockedDescription');
    expect(dbOps.resource).not.toHaveProperty('lockedAt');
    expect(dbOps.resource).not.toHaveProperty('deletedAt');

    // Leap Year (2000)
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lastlogin`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        lastLogin: '2000-02-29T14:48:00.000Z',
      });
    expect(response.status).toBe(200);
    // check if it is updated in the database
    dbOps = await testEnv.dbClient
      .container('user')
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.resource.lastLogin).toBe('2000-02-29T14:48:00.000Z');
    expect(dbOps.resource.deleted).toBe(false);
    expect(dbOps.resource.locked).toBe(false);
    expect(dbOps.resource).not.toHaveProperty('lockedDescription');
    expect(dbOps.resource).not.toHaveProperty('lockedAt');
    expect(dbOps.resource).not.toHaveProperty('deletedAt');
  });
});
