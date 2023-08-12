/**
 * Jest unit test for POST /user/profile/{base64Email}/accepttnc method
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

describe('POST /user/profile/{base64Email}/accepttnc - Accept New Terms and Conditions', () => {
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
  const encodedEmailMap = {
    steve: Buffer.from('steve@wisc.edu', 'utf8').toString('base64url'),
    drag: Buffer.from('drag@wisc.edu', 'utf8').toString('base64url'),
    locked: Buffer.from('locked@wisc.edu', 'utf8').toString('base64url'),
    deleted: Buffer.from('deleted@wisc.edu', 'utf8').toString('base64url'),
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Setup dbClient for tncVersion change
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

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

    // Modify test users
    // Change steve's tncVersion to 1.0.0
    let dbOps = await testEnv.dbClient
      .container(USER)
      .item('drag@wisc.edu')
      .patch([{op: 'set', path: '/tncVersion', value: 'v1.0.0'}]);
    expect(dbOps.statusCode).toBe(200);

    dbOps = await testEnv.dbClient.container(USER).item('drag@wisc.edu').read();
    expect(dbOps.statusCode).toBe(200);
    expect(dbOps.resource.tncVersion).toBe('v1.0.0');
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Neither From Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with No Origin or App
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Wrong Origin
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Wrong App
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrong'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Expired, Wrong or No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with Expired Access Token
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Wrong Access Token
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with No Access Token
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Wrong Email Format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const invalidEmail = Buffer.from('wrong', 'utf8').toString('base64url');
    // Request with Invalid Email
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${invalidEmail}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // Request with Unencoded Email
    response = await request(testEnv.expressServer.app)
      .post('/user/profile/steve@wisc.edu/accepttnc')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Unmatching Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with Unmatching Email
    const response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.drag}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Additional or No Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with No Request Body
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with Additional Request Body
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: '1.0.2', additional: 'additional'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with Wrong Request Body
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({wrong: 'wrong'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - User Locked or Deleted', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Attempt to Update Locked User
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.locked}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.locked})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Attempt to Update Deleted User
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.deleted}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.deleted})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Request Body Does not Match the Latest TnC', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with old TnC Version
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.drag}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.0'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Request with newer TnC Version than the latest
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.drag}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.5'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Request with wrong TnC Version type
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.drag}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'wrong'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // From Web
    // Update Steve (already accepted TnC v1.0.2)
    let response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.steve}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(200);

    // DB Check
    let dbOps = await testEnv.dbClient
      .container(USER)
      .item('steve@wisc.edu')
      .read();
    expect(dbOps.statusCode).not.toBe(404);
    expect(dbOps.resource.id).toBe('steve@wisc.edu');
    expect(dbOps.resource.tncVersion).toBe('v1.0.2');

    // From App
    // Update Drag (has accepted TnC v1.0.0)
    response = await request(testEnv.expressServer.app)
      .post(`/user/profile/${encodedEmailMap.drag}/accepttnc`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({tncVersion: 'v1.0.2'});
    expect(response.status).toBe(200);

    // DB Check
    dbOps = await testEnv.dbClient.container(USER).item('drag@wisc.edu').read();
    expect(dbOps.statusCode).not.toBe(404);
    expect(dbOps.resource.id).toBe('drag@wisc.edu');
    expect(dbOps.resource.tncVersion).toBe('v1.0.2');
  });
});
