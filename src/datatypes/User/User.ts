/**
 * Define type and CRUD methods for each user entry
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';
import IUserUpdateObj from './IUserUpdateObj';

const USER = 'user';

export default class User {
  id: string;
  nickname: string;
  searchTerm: string;
  lastLogin: Date | string;
  signUpDate: Date | string;
  nicknameChanged: Date | string;
  major: string;
  graduationYear: number;
  tncVersion: string;
  deleted: boolean;
  locked: boolean;
  deletedAt?: Date | string;
  lockedDescription?: string;
  lockedAt?: Date | string;

  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: false,
    locked: false
  );
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: true,
    locked: false,
    deletedAt: Date
  );
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: false,
    locked: true,
    deletedAt: undefined,
    lockedDescription: string,
    lockedAt: Date
  );
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: true,
    locked: true,
    deletedAt: Date,
    lockedDescription: string,
    lockedAt: Date
  );
  /**
   * Constructor for User Object
   *
   * @param {string} id - email of the user
   * @param {string} nickname - nickname of the user
   * @param {Date} lastLogin - last login date of the user
   * @param {Date} signUpDate - sign up date of the user
   * @param {Date} nicknameChanged - nickname changed date of the user
   * @param {string} major - major of the user
   * @param {number} graduationYear - graduation year of the user
   * @param {string} tncVersion - terms and conditions version of the user
   * @param {boolean} deleted - whether the user is deleted or not
   * @param {boolean} locked - whether the user is locked or not
   * @param {Date | undefined} deletedAt - date when the user is deleted - undefined if the user is not deleted
   * @param {string | undefined} lockedDescription - description of the lock - undefined if the user is not locked
   * @param {Date | undefined} lockedAt - date when the user is locked - undefined if the user is not locked
   */
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: boolean,
    locked: boolean,
    deletedAt?: Date,
    lockedDescription?: string,
    lockedAt?: Date
  ) {
    this.id = id;
    this.nickname = nickname;
    this.searchTerm = nickname.toUpperCase();
    this.lastLogin = lastLogin;
    this.signUpDate = signUpDate;
    this.nicknameChanged = nicknameChanged;
    this.deleted = deleted;
    this.deletedAt = deletedAt;
    this.locked = locked;
    this.lockedDescription = lockedDescription;
    this.lockedAt = lockedAt;
    this.major = major;
    this.graduationYear = graduationYear;
    this.tncVersion = tncVersion;
  }

  /**
   * Create a new user entry
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {User} user User object to create
   */
  static async create(dbClient: Cosmos.Database, user: User): Promise<void> {
    // Cannot create new user whose status is deleted or locked
    // istanbul ignore if
    if (user.deleted || user.locked) {
      throw new Error(
        '[Data Error] Cannot create new user whose status is deleted or locked'
      );
    }

    // Create a new user entry
    user.lastLogin = (user.lastLogin as Date).toISOString();
    user.signUpDate = (user.signUpDate as Date).toISOString();
    user.nicknameChanged = (user.nicknameChanged as Date).toISOString();
    await dbClient.container(USER).items.create(user);
  }

  /**
   * Check availability of the nickname
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} nickname nickname to verify
   */
  static async readCheckNickname(
    dbClient: Cosmos.Database,
    nickname: string
  ): Promise<boolean> {
    // Convert the nickname to uppercase for case-insensitive search
    const searchTerm = nickname.toUpperCase();
    // Query that checks whether the nickname is already used or not
    return (
      (
        await dbClient
          .container(USER)
          .items.query({
            query: String.prototype.concat(
              `SELECT ${USER}.searchTerm FROM ${USER} `,
              `WHERE ${USER}.deleted = false AND ${USER}.searchTerm = @searchTerm`
            ),
            parameters: [{name: '@searchTerm', value: searchTerm}],
          })
          .fetchAll()
      ).resources.length === 0
    );
  }

  /**
   * Retrieve user information from the database
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} email email of the user
   */
  static async read(dbClient: Cosmos.Database, email: string): Promise<User> {
    // Query that retrieves user information from the database
    const result = await dbClient.container(USER).item(email).read<User>();
    if (result.statusCode === 404 || result.resource === undefined) {
      throw new NotFoundError();
    }

    if (!result.resource.deleted && !result.resource.locked) {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        false,
        false
      );
    } else if (!result.resource.deleted && result.resource.locked) {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        false,
        true,
        undefined,
        result.resource.lockedDescription as string,
        new Date(result.resource.lockedAt as string)
      );
    } else if (result.resource.deleted && !result.resource.locked) {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        true,
        false,
        new Date(result.resource.deletedAt as string)
      );
    } else {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        true,
        true,
        new Date(result.resource.deletedAt as string),
        result.resource.lockedDescription as string,
        new Date(result.resource.lockedAt as string)
      );
    }
  }

  /**
   * Update user with description provided
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} id id of the user to lock
   * @param {IUserUpdateObj} updateObj object that contains update information
   */
  static async update(
    dbClient: Cosmos.Database,
    id: string,
    updateObj: IUserUpdateObj
  ): Promise<void> {
    const updateOps: Cosmos.PatchOperation[] = [];
    const updateDate = new Date().toISOString();
    if (updateObj.nickname !== undefined) {
      updateOps.push({
        op: 'set',
        path: '/nickname',
        value: updateObj.nickname,
      });
      updateOps.push({
        op: 'set',
        path: '/searchTerm',
        value: updateObj.nickname.toUpperCase(),
      });
      updateOps.push({
        op: 'set',
        path: '/nicknameChanged',
        value: updateDate,
      });
    }
    if (updateObj.major !== undefined) {
      updateOps.push({
        op: 'set',
        path: '/major',
        value: updateObj.major,
      });
    }
    if (updateObj.graduationYear !== undefined) {
      updateOps.push({
        op: 'set',
        path: '/graduationYear',
        value: updateObj.graduationYear,
      });
    }

    // Query that locks the user
    const dbOps = await dbClient.container(USER).item(id).patch(updateOps);
    // istanbul ignore if
    if (dbOps.statusCode === 404 || dbOps.resource === undefined) {
      throw new NotFoundError();
    }
  }
}
