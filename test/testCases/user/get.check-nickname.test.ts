/**
 * Jest unit test for GET /user/check-nickname method
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import User from '../../../src/datatypes/User/User';

describe('GET /user/check-nickname - Verify Nickname', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    valid: '',
    wrong: '',
    expired: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create a new user
    // create multiple users to check if the function can iterate through all the users
    const userSamples: User[] = [];
    userSamples.push(
      {
        id: 'steve@wisc.edu',
        nickname: 'steve',
        lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
        signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.2',
        deleted: false,
        locked: false,
      },
      {
        id: 'drag@wisc.edu',
        nickname: 'drag',
        lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
        signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        deleted: false,
        locked: false,
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.2',
      },
      {
        id: 'deleted@wisc.edu',
        nickname: 'deleted',
        lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
        signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        deleted: true,
        deletedAt: new Date('2023-03-10T00:55:48.183Z').toISOString(),
        locked: false,
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.2',
      },
      {
        id: 'locked@wisc.edu',
        nickname: 'locked',
        lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
        signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
        deleted: false,
        locked: false,
        lockedDescription: 'Spam',
        lockedAt: new Date('2023-03-10T00:55:48.183Z').toISOString(),
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.2',
      }
    );
    for (let index = 0; index < userSamples.length; index++) {
      await testEnv.dbClient.container('user').items.create(userSamples[index]);
    }

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
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
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
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    // Expired Access Token
    // Token Content
    tokenContent = {
      id: 'expired@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.expired = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '1ms',
      }
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No Application Key and Not Origin', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request From Not Permitted Origin
    let response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://suspicious.app'})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request From Not Permitted Application Key
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<NOT PERMITTED APP>'})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with Missing Origin and Application Key
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Additional or No Request Body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with not permitted property
    let response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({additional: 'property'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with additional property
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'steve', additional: 'property'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with no request body
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with No Access Token
    const response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 10 ms
    await new Promise(resolve => setTimeout(resolve, 10));

    // Request with Expired Access Token
    const response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with Wrong Access Token
    const response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success - Nickname Available', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request from Web
    let response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'newNickname'});
    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(true);

    // Request from App
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({nickname: 'newNickname'});

    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(true);
  });

  test('Success - Nickname not Available', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'drag'});
    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(false);

    // Request From App
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({nickname: 'steve'});
    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(false);

    // Locked user
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({nickname: 'locked'});
    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(false);
  });

  test('Success - Deleted Nickname', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({nickname: 'deleted'});
    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(true);

    // Request From App
    response = await request(testEnv.expressServer.app)
      .get('/user/check-nickname')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({nickname: 'deleted'});
    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toBe(true);
  });
});
