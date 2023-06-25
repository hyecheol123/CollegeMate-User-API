/**
 * Define type and CRUD methods for each user entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import BadRequestError from '../../exceptions/BadRequestError';
import NotFoundError from '../../exceptions/NotFoundError';
import ConflictError from '../../exceptions/ConflictError';

const USER = 'user';

export default class User {
  id: string;
  nickname: string;
  lastLogin: Date | string;
  signUpDate: Date | string;
  nicknameChanged: Date | string;
  deleted: boolean;
  deletedAt?: Date | string;
  locked: boolean;
  lockedDescription?: string;
  lockedAt?: Date | string;
  major: string;
  graduationYear: number;
  tncVersion: string;

  /**
   * Constructor for User Object
   *
   * @param {string} id - email of the user
   * @param {string} nickname - nickname of the user
   * @param {Date | string} lastLogin - last login date of the user
   * @param {Date | string} signUpDate - sign up date of the user
   * @param {Date | string} nicknameChanged - nickname changed date of the user
   * @param {boolean} deleted - whether the user is deleted or not
   * @param {Date | string | undefined} deletedAt - date when the user is deleted - undefined if the user is not deleted
   * @param {boolean} locked - whether the user is locked or not
   * @param {string | undefined} lockedDescription - description of the lock - undefined if the user is not locked
   * @param {Date | string | undefined} lockedAt - date when the user is locked - undefined if the user is not locked
   * @param {string} major - major of the user
   * @param {number} graduationYear - graduation year of the user
   * @param {string} tncVersion - terms and conditions version of the user
   */
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date | string,
    signUpDate: Date | string,
    nicknameChanged: Date | string,
    deleted: boolean,
    deletedAt: Date | string | undefined,
    locked: boolean,
    lockedDescription: string | undefined,
    lockedAt: Date | string | undefined,
    major: string,
    graduationYear: number,
    tncVersion: string
  ) {
    this.id = id;
    this.nickname = nickname;
    this.lastLogin = lastLogin;
    this.signUpDate = signUpDate;
    this.nicknameChanged = nicknameChanged;
    this.deleted = deleted;
    if (deleted) {
      if (deletedAt === undefined) {
        throw BadRequestError;
      }
      this.deletedAt = deletedAt;
    }
    this.locked = locked;
    if (locked) {
      if (lockedDescription === undefined || lockedAt === undefined) {
        throw BadRequestError;
      }
      this.lockedDescription = lockedDescription;
      this.lockedAt = lockedAt;
    }
    this.major = major;
    this.graduationYear = graduationYear;
    this.tncVersion = tncVersion;
  }

  /**
   * Check availability of the nickname
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} nickname nickname to verify
   */
  static async checkNickname(
    dbClient: Cosmos.Database,
    nickname: string
  ): Promise<boolean> {
    // Query that checks whether the nickname is already used or not
    return (
      (
        await dbClient
          .container(USER)
          .items.query({
            query: `SELECT user.nickname FROM user WHERE user.deleted = false AND user.nickname = "${nickname}"`,
          })
          .fetchAll()
      ).resources.length === 0
    );
  }

  /**
   * Retrieve user information from the database
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} id id of the user
   */
  static async read(dbClient: Cosmos.Database, id: string): Promise<User> {
    // Query that retrieves user information from the database
    const result = await dbClient.container(USER).item(id).read<User>();
    if (result.statusCode === 404 || result.resource === undefined) {
      throw new NotFoundError();
    }
    const user = result.resource;
    return new User(
      user.id,
      user.nickname,
      user.lastLogin,
      user.signUpDate,
      user.nicknameChanged,
      user.deleted,
      user.deletedAt,
      user.locked,
      user.lockedDescription,
      user.lockedAt,
      user.major,
      user.graduationYear,
      user.tncVersion
    );
  }

  /**
   * Lock user with description provided
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} id id of the user to lock
   * @param {string} description description of the lock
   */
  static async lock(
    dbClient: Cosmos.Database,
    id: string,
    description: string
  ): Promise<void> {
    // Query that locks the user
    const dbOps = await dbClient
      .container(USER)
      .item(id)
      .patch([
        {op: 'set', path: '/locked', value: true},
        {op: 'set', path: '/lockedDescription', value: description},
        {op: 'set', path: '/lockedAt', value: new Date().toISOString()},
      ]);

    if (dbOps.statusCode === 404 || dbOps.resource === undefined) {
      throw new NotFoundError();
    }
  }
}
