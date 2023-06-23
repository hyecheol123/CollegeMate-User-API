/**
 * Jest unit test for POST /user/profile/{base64Email} method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import User from '../../../src/datatypes/User/User';
import AuthToken from '../../../src/datatypes/Token/AuthToken';

describe('POST /user/profile/{base64Email} - Lock User (Server Use Only)', () => {
    let testEnv: TestEnv;
    const userMap = {
        steve: {} as User,
        locked: {} as User,
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
            'locked@wisc.edu',
            'locked',
            new Date().toISOString(),
            new Date().toISOString(),
            new Date().toISOString(),
            false,
            undefined,
            true,
            'Posted unauthorized advertisement to course evaluation',
            new Date().toISOString(),
            'Computer Science',
            2024,
            '1.0.0'
        );
        await testEnv.dbClient.container('user').items.create(user);
        userMap.locked = user;
    });

    afterEach(async () => {
        await testEnv.stop();
    });

    test('Fail - Request without ServerAdminToken', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;

        // Request without any token
        let response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`);
        expect(response.status).toBe(401); 
        expect(response.body.error).toBe('Unauthenticated'); 

        // Request without X-Server-Token
        response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-OTHER-TOKEN': '<Some-Other-Value>'})
            .set({Origin: 'https://collegemate.app'});
        expect(response.status).toBe(401); 
        expect(response.body.error).toBe('Unauthenticated'); 
        
    });

    test('Fail - Request with invalid ServerAdminToken', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;

        // Provide accessToken of user as ServerAdminToken
        // Generate token
        let tokenContent: AuthToken = {
            id: 'existing@wisc.edu',
            type: 'access',
            tokenType: 'user',
        };
        let token = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
            algorithm: 'HS512',
            expiresIn: '60m',
        });
        // Request
        let response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-SERVER-TOKEN': token});
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');

        // Provide serverAdminToken that signed with wrong key
        // Generate Token
        tokenContent = {
            id: 'testAdmin',
            type: 'access',
            tokenType: 'serverAdmin',
            accountType: 'admin',
        }; 
        token = jwt.sign(tokenContent, 'wrong key', {
            algorithm: 'HS512',
            expiresIn: '60m',
        });

        // Request
        response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-SERVER-TOKEN': token});
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');

        // Missing Account Type
        // Generate Token
        tokenContent = {
            id: 'testAdmin',
            type: 'access',
            tokenType: 'serverAdmin',
        };
        token = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
            algorithm: 'HS512',
            expiresIn: '60m',
        });
        // Request
        response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-SERVER-TOKEN': token});
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

        // Wait for 10 ms
        await new Promise(resolve => setTimeout(resolve, 10));

        // Request
        const response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-SERVER-TOKEN': token});
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');

    });


    test('Fail - Not existing Email', async () => {
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
            expiresIn: '10m',
        });

        // Request
        const response = await request(testEnv.expressServer.app) 
            .post('/user/profile/doesNotExist@wisc.edu/lock')
            .set({'X-SERVER-TOKEN': token})
            .send({description: "Posted unauthorized advertisement to course evaluation"});
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Not Found');
    });

    test('Fail - Bad Request', async () => {
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
            expiresIn: '10m',
        });

        // Request with invalid request body
        const response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-SERVER-TOKEN': token})
            .send({invalidProperty: 'invalidValue'});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');
    });

    test('Fail - User Already Locked', async () => {
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
            expiresIn: '10m',
        });

        // Request
        const response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.locked.email}/lock`)
            .set({'X-SERVER-TOKEN': token})
            .send({description: "Posted unauthorized advertisement to course evaluation"});
        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Conflict');
    });

    test('Success - Lock User', async () => {
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
            expiresIn: '10m',
        });
    
        // Request to lock the user profile
        const response = await request(testEnv.expressServer.app)
            .post(`/user/profile/${userMap.steve.email}/lock`)
            .set({'X-SERVER-TOKEN': token})
            .set({Origin: 'https://collegemate.app'})
            .send({description: "Posted unauthorized advertisement to course evaluation"});
        expect(response.status).toBe(200);
        expect(response.body.locked).toBe(true);
        expect(response.body.lockedDescription).toBe("Posted unauthorized advertisement to course evaluation");
    });
});
