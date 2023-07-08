/**
 * Jest unit test for POST /user/profile/{base64Email} method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
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

describe('POST /user/profile/{base64id} - Lock User (Server Use Only)', () => {
  let testEnv: TestEnv;
  const serverTokenMap = {
    accessToken: '',
    wrongKey: '',
    missingAccountType: '',
    valid: '',
    refresh: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Access Token
    let tokenContent: AuthToken = {
      id: 'existing@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    serverTokenMap.accessToken = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );

    // Refresh Token
    tokenContent = {
      id: 'testAdmin',
      type: 'refresh',
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

    // Wrong Token Key
    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    serverTokenMap.wrongKey = jwt.sign(tokenContent, 'wrong key', {
      algorithm: 'HS512',
      expiresIn: '60m',
    });

    // Missing Account Type Token
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

    // Valid ServerAdmin Token
    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    serverTokenMap.valid = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
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
      `/user/profile/${encodedEmail}/lock`
    );
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');

    // Request without X-Server-Token
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
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
      .post(`/user/profile/${encodedEmail}}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.accessToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with serverAdminToken with wrong hashkey
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.wrongKey});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with serverAdminToken without accountType
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.missingAccountType});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with wrong type of token
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.refresh});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Expired ServerAdminToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Generate token
    const tokenContent: AuthToken = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    const token = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '1ms',
    });

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    // Request
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Non-Existent Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request
    const invalidEmail = Buffer.from('invalidEmail@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${invalidEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
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
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({invalidProperty: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with additional request body
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
        invalidProperty: 'invalidValue',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with no request body
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - User Already Locked or Deleted', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const lockedEmail = Buffer.from('locked@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${lockedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Request
    const deletedEmail = Buffer.from('deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${deletedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Wrong Email Format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const wrongEmail = Buffer.from('WrongEmailType', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${wrongEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request to lock the user profile
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': serverTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(200);

    // check if it is updated in the database
    const dbOps = await testEnv.dbClient
      .container('user')
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.resource.locked).toBe(true);
    expect(dbOps.resource.lockedDescription).toContain(
      'Posted unauthorized advertisement to course evaluation'
    );
    expect(dbOps.resource).toHaveProperty('lockedAt');
  });
});
