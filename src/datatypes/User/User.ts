/**
 * Define type and CRUD methods for each user entry
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';

const USER = 'user';

export default class User {
  email: string;
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

  constructor(
    email: string,
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
    email: string,
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
    email: string,
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
    email: string,
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
   * @param {string} email - email of the user
   * @param {string} nickname - nickname of the user
   * @param {Date} lastLogin - last login date of the user
   * @param {Date} signUpDate - sign up date of the user
   * @param {Date} nicknameChanged - nickname changed date of the user
   * @param {boolean} deleted - whether the user is deleted or not
   * @param {Date | undefined} deletedAt - date when the user is deleted - undefined if the user is not deleted
   * @param {boolean} locked - whether the user is locked or not
   * @param {string | undefined} lockedDescription - description of the lock - undefined if the user is not locked
   * @param {Date | undefined} lockedAt - date when the user is locked - undefined if the user is not locked
   * @param {string} major - major of the user
   * @param {number} graduationYear - graduation year of the user
   * @param {string} tncVersion - terms and conditions version of the user
   */
  constructor(
    email: string,
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
    this.email = email;
    this.nickname = nickname;
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
    // Create a new user entry
    user.lastLogin = new Date().toISOString();
    user.signUpDate = new Date().toISOString();
    user.nicknameChanged = new Date().toISOString();
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
    // Query that checks whether the nickname is already used or not
    return (
      (
        await dbClient
          .container(USER)
          .items.query({
            query: String.prototype.concat(
              `SELECT ${USER}.nickname FROM ${USER} `,
              `WHERE ${USER}.deleted = false AND ${USER}.nickname = @nickname`
            ),
            parameters: [{name: '@nickname', value: nickname}],
          })
          .fetchAll()
      ).resources.length === 0
    );
  }
}
