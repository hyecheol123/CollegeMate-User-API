/**
 * Jest unit test for GET /user/{base64Email} method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import User from '../../../src/datatypes/User/User';
import AuthToken from '../../../src/datatypes/Token/AuthToken';

describe('GET /user/profile/{base64Email} - Get User Profile', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    valid: '',
    wrong: '',
    expired: '',
    self: '',
    lockedSelf: '',
  };
  const userMap = {
    steve: {} as User,
    drag: {} as User,
    lockedAndDeleted: {} as User,
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Enter Test Data into Database
    // Create Users
    let user = new User(
      'steve@wisc.edu',
      'steve',
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      false,
      undefined,
      false,
      undefined,
      undefined,
      'Computer Science',
      2024,
      '1.0.0'
    );
    await testEnv.dbClient.container('user').items.create(user);
    userMap.steve = user;
    user = new User(
      'drag@wisc.edu',
      'drag',
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      false,
      undefined,
      false,
      undefined,
      undefined,
      'Computer Science',
      2024,
      '1.0.0'
    );
    await testEnv.dbClient.container('user').items.create(user);
    userMap.drag = user;
    user = new User(
      'lockedAndDeleted@wisc.edu',
      'lockedAndDeleted',
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      true,
      new Date().toISOString(),
      true,
      new Date().toISOString(),
      new Date().toISOString(),
      'Computer Science',
      2024,
      '1.0.0'
    );
    await testEnv.dbClient.container('user').items.create(user);
    userMap.lockedAndDeleted = user;

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

    // Self Token
    // Token Content
    tokenContent = {
      id: userMap.steve.email,
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.self = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    // locked self Token
    tokenContent = {
      id: userMap.lockedAndDeleted.email,
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.lockedSelf = jwt.sign(
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

  test('Fail - Neither Admin or from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.self});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.self})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.self})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access or Admin Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request without any access or admin token
    const response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
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
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
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
      {
        algorithm: 'HS512',
        expiresIn: '1ms',
      }
    );
    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    //request with an expired admin token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': adminToken})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    //request with a wrong access token - refresh token
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request with a wrong access token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
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
      {
        algorithm: 'HS512',
        expiresIn: '60min',
      }
    );
    // create wrong admin token
    const wrongType = jwt.sign(
      {
        id: 'testAdmin',
        type: 'access',
        tokenType: 'serverAdmin',
        accountType: 'wrong',
      },
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60min',
      }
    );

    //request with a wrong admin token - refresh token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-SERVER-TOKEN': wrongToken})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request with a wrong admin token - wrong type
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-SERVER-TOKEN': wrongType})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    //request with a wrong admin token
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-SERVER-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Email not found', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request with an invalid email
    const response = await request(testEnv.expressServer.app)
      .get('/user/profile/doesNotExist@wisc.edu')
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
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe(userMap.steve.major);
    expect(response.body.graduationYear).toBe(userMap.steve.graduationYear);
    expect(response.body.lastLogin).toBe(userMap.steve.lastLogin);
    expect(response.body.nicknameChanged).toBe(userMap.steve.nicknameChanged);
    expect(response.body.deleted).toBe(userMap.steve.deleted);
    expect(response.body.locked).toBe(userMap.steve.locked);
    expect(response.body).not.toHaveProperty('email');

    //request with an admin token - different user
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.drag.email}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('drag');
    expect(response.body.major).toBe(userMap.drag.major);
    expect(response.body.graduationYear).toBe(userMap.drag.graduationYear);
    expect(response.body.lastLogin).toBe(userMap.drag.lastLogin);
    expect(response.body.nicknameChanged).toBe(userMap.drag.nicknameChanged);
    expect(response.body.deleted).toBe(userMap.drag.deleted);
    expect(response.body.locked).toBe(userMap.drag.locked);
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('deletedAt');

    //request with an admin token - locked and deleted user
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.lockedAndDeleted.email}`)
      .set({'X-SERVER-TOKEN': token});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('lockedAndDeleted');
    expect(response.body.major).toBe(userMap.lockedAndDeleted.major);
    expect(response.body.graduationYear).toBe(
      userMap.lockedAndDeleted.graduationYear
    );
    expect(response.body.lastLogin).toBe(userMap.lockedAndDeleted.lastLogin);
    expect(response.body.nicknameChanged).toBe(
      userMap.lockedAndDeleted.nicknameChanged
    );
    expect(response.body.deleted).toBe(userMap.lockedAndDeleted.deleted);
    expect(response.body.deletedAt).toBe(userMap.lockedAndDeleted.deletedAt);
    expect(response.body.locked).toBe(userMap.lockedAndDeleted.locked);
    expect(response.body).not.toHaveProperty('email');
  });

  test('Success - Owner Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    //request self
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.self})
      .set({Origin: 'https://collegemate.app'});

    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe(userMap.steve.major);
    expect(response.body.graduationYear).toBe(userMap.steve.graduationYear);
    expect(response.body.lastLogin).toBe(userMap.steve.lastLogin);
    expect(response.body.nicknameChanged).toBe(userMap.steve.nicknameChanged);
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');

    //request self
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.lockedAndDeleted.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.lockedSelf})
      .set({Origin: 'https://collegemate.app'});

    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('lockedAndDeleted');
    expect(response.body.major).toBe(userMap.lockedAndDeleted.major);
    expect(response.body.graduationYear).toBe(
      userMap.lockedAndDeleted.graduationYear
    );
    expect(response.body.lastLogin).toBe(userMap.lockedAndDeleted.lastLogin);
    expect(response.body.nicknameChanged).toBe(
      userMap.lockedAndDeleted.nicknameChanged
    );
    expect(response.body).not.toHaveProperty('deleted');
    expect(response.body).not.toHaveProperty('deletedAt');
  });

  test('Success - Other Users Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe(userMap.steve.major);
    expect(response.body.graduationYear).toBe(userMap.steve.graduationYear);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('nicknameChanged');

    // Request From Web - different user
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.drag.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('drag');
    expect(response.body.major).toBe(userMap.drag.major);
    expect(response.body.graduationYear).toBe(userMap.drag.graduationYear);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('nicknameChanged');

    // Request From App
    response = await request(testEnv.expressServer.app)
      .get(`/user/profile/${userMap.steve.email}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe('steve');
    expect(response.body.major).toBe(userMap.steve.major);
    expect(response.body.graduationYear).toBe(userMap.steve.graduationYear);
    expect(response.body).not.toHaveProperty('lastLogin');
    expect(response.body).not.toHaveProperty('nicknameChanged');
  });
});
