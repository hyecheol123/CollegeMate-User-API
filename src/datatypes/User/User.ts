/**
 * Define type and CRUD methods for each user entry
 *
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

  /**
   * Constructor for User Object
   *
   * @param {string} email - email of the user
   * @param {string} nickname - nickname of the user
   * @param {Date | string} lastLogin - last login date of the user
   * @param {Date | string} signUpDate - sign up date of the user
   * @param {Date | string} nicknameChanged - nickname changed date of the user
   * @param {boolean} deleted - whether the user is deleted or not
   * @param {boolean} locked - whether the user is locked or not
   * @param {string} major - major of the user
   * @param {number} graduationYear - graduation year of the user
   * @param {string} tncVersion - terms and conditions version of the user
   */
  constructor(
    email: string,
    nickname: string,
    lastLogin: Date | string,
    signUpDate: Date | string,
    nicknameChanged: Date | string,
    deleted: boolean,
    locked: boolean,
    major: string,
    graduationYear: number,
    tncVersion: string
  ) {
    this.email = email;
    this.nickname = nickname;
    this.lastLogin = lastLogin;
    this.signUpDate = signUpDate;
    this.nicknameChanged = nicknameChanged;
    this.deleted = deleted;
    this.locked = locked;
    this.major = major;
    this.graduationYear = graduationYear;
    this.tncVersion = tncVersion;
  }

  /**
   * Retrieve nickname of the user
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   */
  static async readNicknames(dbClient: Cosmos.Database): Promise<string[]> {
    // Query that returns all nicknames in the database
    return (
      await dbClient
        .container(USER)
        .items.query({
          query: 'SELECT c.nickname FROM c WHERE c.deleted = false',
        })
        .fetchAll()
    ).resources.map(user => user.nickname);
  }
}
