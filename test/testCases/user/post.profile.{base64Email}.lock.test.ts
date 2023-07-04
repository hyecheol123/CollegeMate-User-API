/**
 * Jest unit test for POST /user/profile/{base64id} method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
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
  const accessTokenMap = {
    accessToken: '',
    wrongKey: '',
    missingAccountType: '',
    valid: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    let tokenContent: AuthToken = {
      id: 'existing@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    accessTokenMap.accessToken = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );

    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    accessTokenMap.wrongKey = jwt.sign(tokenContent, 'wrong key', {
      algorithm: 'HS512',
      expiresIn: '60m',
    });

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

    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    accessTokenMap.valid = jwt.sign(
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
    let response = await request(testEnv.expressServer.app)
    .post(`/user/profile/${encodedEmail}/lock`);
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
      .set({'X-SERVER-TOKEN': accessTokenMap.accessToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': accessTokenMap.wrongKey});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': accessTokenMap.missingAccountType});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - ServerAdminToken expired', async () => {
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

    // Wait for 20 ms
    await new Promise(resolve => setTimeout(resolve, 10));

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

  test('Fail - Not existing id', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const invalidEmail = Buffer.from('doesnotExist@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${invalidEmail}/lock`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Bad Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with invalid request body
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({invalidProperty: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - User Already Locked', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const lockedEmail = Buffer.from('locked@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${lockedEmail}/lock`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Success - Lock User', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request to lock the user profile
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmail}/lock`)
      .set({'X-SERVER-TOKEN': accessTokenMap.valid})
      .send({
        description: 'Posted unauthorized advertisement to course evaluation',
      });
    expect(response.status).toBe(200);
    expect(response.body.locked).toBe(true);
    expect(response.body.lockedDescription).toBe(
      'Posted unauthorized advertisement to course evaluation'
    );
  });
});