/**
 * Setup test environment
 *  - Setup Database for testing
 *  - Build table that will be used during the testing
 *  - Setup express server
 *
 * Teardown test environment after test
 *  - Remove used table and close database connection from the express server
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as crypto from 'crypto';
import * as Cosmos from '@azure/cosmos';
import TestConfig from './TestConfig';
import ExpressServer from '../src/ExpressServer';
import User from '../src/datatypes/User/User';

/**
 * Class for Test Environment
 */
export default class TestEnv {
  testConfig: TestConfig; // Configuration Object (to use hash function later)
  expressServer: ExpressServer | undefined; // Express Server Object
  dbClient: Cosmos.Database | undefined; // DB Client Object
  dbIdentifier: string; // unique identifier string for the database

  /**
   * Constructor for TestEnv
   *  - Setup express server
   *  - Setup db client
   *
   * @param identifier Identifier to specify the test
   */
  constructor(identifier: string) {
    // Hash identifier to create new identifier string
    this.dbIdentifier = crypto
      .createHash('md5')
      .update(identifier)
      .digest('hex');

    // Generate TestConfig obj
    this.testConfig = new TestConfig(this.dbIdentifier);
  }

  /**
   * beforeEach test case, run this function
   * - Setup Database for testing
   * - Build table that will be used during the testing
   */
  async start(): Promise<void> {
    // Setup DB
    const dbClient = new Cosmos.CosmosClient({
      endpoint: this.testConfig.db.endpoint,
      key: this.testConfig.db.key,
    });
    const dbOps = await dbClient.databases.create({
      id: this.testConfig.db.databaseId,
    });
    /* istanbul ignore next */
    if (dbOps.statusCode !== 201) {
      throw new Error(JSON.stringify(dbOps));
    }
    this.dbClient = dbClient.database(this.testConfig.db.databaseId);

    // user container
    const containerOps = await this.dbClient.containers.create({
      id: 'user',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {path: '/"nicknameChangedAt"/?'},
          {path: '/"deletedAt"/?'},
          {path: '/"lockedDescription"/?'},
          {path: '/"lockedAt"/?'},
          {path: '/"_etag"/?'},
        ],
      },
      uniqueKeyPolicy: {
        uniqueKeys: [{paths: ['/nickname']}],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
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
        deleted: false,
        locked: false,
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.2',
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
        locked: false,
        deletedAt: new Date('2023-03-10T00:55:48.183Z').toISOString(),
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
        locked: true,
        lockedDescription: 'Spam',
        lockedAt: new Date('2023-03-10T00:55:48.183Z').toISOString(),
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.2',
      },
      {
        id: 'locked-deleted@wisc.edu',
        nickname: 'locked&Deleted',
        lastLogin: new Date('2022-03-10T00:50:43.000Z').toISOString(),
        signUpDate: new Date('2022-02-10T00:50:43.000Z').toISOString(),
        nicknameChanged: new Date('2022-02-10T00:50:43.000Z').toISOString(),
        deleted: true,
        locked: true,
        deletedAt: new Date('2023-02-11T00:55:48.183Z').toISOString(),
        lockedDescription: 'Spam',
        lockedAt: new Date('2023-02-10T00:55:48.183Z').toISOString(),
        major: 'Computer Science',
        graduationYear: 2024,
        tncVersion: 'v1.0.1',
      }
    );
    for (let index = 0; index < userSamples.length; index++) {
      await this.dbClient.container('user').items.create(userSamples[index]);
    }

    // Setup Express Server
    this.expressServer = new ExpressServer(this.testConfig);
  }

  /**
   * Teardown test environment after test
   *  - Remove used resources (DB)
   *  - close database/redis connection from the express server
   */
  async stop(): Promise<void> {
    // Drop database
    await (this.dbClient as Cosmos.Database).delete();

    // Close database connection of the express server
    await (this.expressServer as ExpressServer).closeServer();

    // Close database connection used during tests
    await (this.dbClient as Cosmos.Database).client.dispose();
  }
}
