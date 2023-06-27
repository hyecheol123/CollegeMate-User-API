/**
 * Jest unit test for GET /user/{base64id} method
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

describe('GET /user/profile/{base64id} - Get User Profile', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    valid: '',
    wrong: '',
    expired: '',
    steve: '',
    locked: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

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

    // Self Token
    // Token Content
    tokenContent = {id: 'steve@wisc.edu', type: 'access', tokenType: 'user'};
    // Generate AccessToken
    accessTokenMap.steve = jwt.sign(
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
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Neither Admin or from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request without any origin or app
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access or Admin Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request without any access or admin token
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    const response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access or Admin Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    //request with an expired access token
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // create expired admin token
    const adminToken = jwt.sign(
      {
        id: 'testAdmin',
        type: 'access',
        tokenType: 'serverAdmin',
        accountType: 'admin',
      },
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '1ms'}
    );
    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    //request with an expired admin token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': adminToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request with a wrong access token - refresh token
    const encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request with a wrong access token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // create wrong admin token
    const wrongToken = jwt.sign(
      {
        id: 'testAdmin',
        type: 'refresh',
        tokenType: 'serverAdmin',
        accountType: 'admin',
      },
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '60min'}
    );

    //request with a wrong admin token - refresh token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': wrongToken});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // create wrong admin token
    const wrongType = jwt.sign(
      {
        id: 'testAdmin',
        type: 'access',
        tokenType: 'serverAdmin',
        accountType: 'wrong',
      },
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '60min'}
    );

    //request with a wrong admin token - wrong type
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': wrongType});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Email Format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const invalidEmail = Buffer.from('wrong', 'utf8').toString('base64url');
    //request with an invalid id
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${invalidEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    //request with an not encoded email
    response = await request(testEnv.expressServer.app)
      .get('/user/profile/steve@wisc.edu')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - id not found', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const invalidEmail = Buffer.from('doesnotExist@wisc.edu', 'utf8').toString(
      'base64url'
    );
    //request with an invalid id
    const response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${invalidEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Success - Admin', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Generate admin token
    const tokenContent: AuthToken = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    const token = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '60m',
    });

    //request with an admin token
    let encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.signUpDate).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body.tncVersion).toBe('v1.0.2');
    expect(response.body.deleted).toBe(false);
    expect(response.body.locked).toBe(false);
    expect(response.body).not.toHaveProperty('id');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('lockedDescription');

    //request with an admin token - different user
    encodedEmail = Buffer.from('drag@wisc.edu', 'utf8').toString('base64url');
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('drag');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.signUpDate).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body.tncVersion).toBe('v1.0.2');
    expect(response.body.deleted).toBe(false);
    expect(response.body.locked).toBe(false);
    expect(response.body).not.toHaveProperty('id');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('lockedDescription');

    // Locked User
    encodedEmail = Buffer.from('locked@wisc.edu', 'utf8').toString('base64url');
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('locked');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.signUpDate).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body.deleted).toBe(false);
    expect(response.body.locked).toBe(true);
    expect(response.body).not.toHaveProperty('id');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(new Date(response.body.lockedAt).toISOString()).toBe(
      new Date('2023-03-10T00:55:48.183Z').toISOString()
    );
    expect(response.body.lockedDescription).toBe('Spam');
    expect(response.body.tncVersion).toBe('v1.0.2');

    // Deleted User
    encodedEmail = Buffer.from('deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('deleted');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.signUpDate).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body.deleted).toBe(true);
    expect(response.body.locked).toBe(false);
    expect(response.body).not.toHaveProperty('id');
    expect(new Date(response.body.deletedAt).toISOString()).toBe(
      new Date('2023-03-10T00:55:48.183Z').toISOString()
    );
    expect(response.body.tncVersion).toBe('v1.0.2');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('lockedDescription');

    // Locked and deleted User
    encodedEmail = Buffer.from('locked-deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('locked&Deleted');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.signUpDate).toISOString()).toEqual(
      new Date('2022-02-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2022-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2022-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body.deleted).toBe(true);
    expect(response.body.locked).toBe(true);
    expect(response.body).not.toHaveProperty('id');
    expect(new Date(response.body.deletedAt).toISOString()).toBe(
      new Date('2023-02-11T00:55:48.183Z').toISOString()
    );
    expect(new Date(response.body.lockedAt).toISOString()).toBe(
      new Date('2023-02-10T00:55:48.183Z').toISOString()
    );
    expect(response.body.lockedDescription).toBe('Spam');
    expect(response.body.tncVersion).toBe('v1.0.1');
  });

  test('Success - Owner Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request self
    let encodedEmail = Buffer.from('steve@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');

    // request self - locked user
    encodedEmail = Buffer.from('locked@wisc.edu', 'utf8').toString('base64url');
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.locked})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('locked');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');

    // request self - deleted user
    encodedEmail = Buffer.from('deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let token = jwt.sign(
      {id: 'deleted@wisc.edu', type: 'access', tokenType: 'user'},
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': token})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('deleted');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2023-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2023-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');

    // request self - deleted and locked user
    encodedEmail = Buffer.from('locked-deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    token = jwt.sign(
      {id: 'locked-deleted@wisc.edu', type: 'access', tokenType: 'user'},
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': token})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('locked&Deleted');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(new Date(response.body.lastLogin).toISOString()).toEqual(
      new Date('2022-03-10T00:50:43.000Z').toISOString()
    );
    expect(new Date(response.body.nicknameChanged).toISOString()).toEqual(
      new Date('2022-02-10T00:50:43.000Z').toISOString()
    );
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');
  });

  test('Success - Other Users Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request From Web - different user
    let encodedEmail = Buffer.from('drag@wisc.edu', 'utf8').toString(
      'base64url'
    );
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('drag');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('nicknameChanged');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');

    // Deleted User
    encodedEmail = Buffer.from('deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('deleted');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('nicknameChanged');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');

    // Locked User
    encodedEmail = Buffer.from('locked@wisc.edu', 'utf8').toString('base64url');
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('locked');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('nicknameChanged');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');

    // Locked and Deleted User
    encodedEmail = Buffer.from('locked-deleted@wisc.edu', 'utf8').toString(
      'base64url'
    );
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${encodedEmail}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('locked&Deleted');
    expect(response.body.major).toBe('Computer Science');
    expect(response.body.graduationYear).toBe(2024);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('signUpDate');
    expect(response.body).not.toHaveProperty('nicknameChanged');
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(response.body).not.toHaveProperty('locked');
    expect(response.body).not.toHaveProperty('lockedDescription');
    expect(response.body).not.toHaveProperty('lockedAt');
    expect(response.body).not.toHaveProperty('tncVersion');
  });
});
