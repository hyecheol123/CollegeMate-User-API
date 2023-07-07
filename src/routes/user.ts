/**
 * Express Router middlewhare for User APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import {Buffer} from 'node:buffer';
import User from '../datatypes/User/User';
import UserPostRequestObj from '../datatypes/User/UserPostRequestObj';
import getTnC from '../datatypes/TNC/getTnC';
import AuthToken from '../datatypes/Token/AuthToken';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';
import ConflictError from '../exceptions/ConflictError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import NotFoundError from '../exceptions/NotFoundError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import verifyServerAdminToken from '../functions/JWT/verifyServerAdminToken';
import {validateEmail} from '../functions/inputValidator/validateEmail';
import {validateUserPostRequest} from '../functions/inputValidator/validateUserPostProfileRequest';
import {validateVerifyNicknameRequest} from '../functions/inputValidator/validateVerifyNicknameRequest';
import UserProfileResponseObj from '../datatypes/User/UserProfileResponseObj';
import {validateLastLoginRequest} from '../functions/inputValidator/validateLastLoginRequest';

// Path: /user
const userRouter = express.Router();

// POST: /user
userRouter.post('/', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Header check - access token
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken === undefined) {
      throw new UnauthenticatedError();
    }
    const tokenContents = verifyAccessToken(
      accessToken,
      req.app.get('jwtAccessKey')
    );

    // Check request body
    const userPostRequestObj: UserPostRequestObj = req.body;
    if (!validateUserPostRequest(userPostRequestObj)) {
      throw new BadRequestError();
    }

    // Check if access token has the same email as the request body
    if (tokenContents.id !== userPostRequestObj.email) {
      throw new ForbiddenError();
    }

    // Check if the TnC version is the latest
    const latestTnCVersion = (await getTnC(req)).version;

    if (
      !latestTnCVersion ||
      latestTnCVersion !== userPostRequestObj.tncVersion
    ) {
      throw new ConflictError();
    }

    // DB operation - check nickname availability
    const available = await User.readCheckNickname(
      dbClient,
      userPostRequestObj.nickname
    );
    if (!available) {
      throw new BadRequestError();
    }

    // DB operation - create user
    const currDate = new Date();
    const user = new User(
      userPostRequestObj.email,
      userPostRequestObj.nickname,
      currDate,
      currDate,
      currDate,
      userPostRequestObj.major,
      userPostRequestObj.graduationYear,
      userPostRequestObj.tncVersion,
      false,
      false
    );
    await User.create(dbClient, user);
    res.status(201).send();
  } catch (e) {
    next(e);
  }
});

// // DELETE: /user/profile/{base64Email}
// userRouter.delete('/profile/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // PATCH: /user/profile/{base64Email}
// userRouter.patch('/profile/:base64Email', async (req, res, next) => {
//   // TODO
// });

// GET: /user/profile/{base64Email}
userRouter.get('/profile/:base64Email', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Header check - access token or Origin header or application key
    const serverToken = req.header('X-SERVER-TOKEN');
    if (
      serverToken === undefined &&
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Check server admin token or access token - which is provided
    let tokenContents: AuthToken | undefined = undefined;
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (serverToken !== undefined) {
      verifyServerAdminToken(serverToken, req.app.get('jwtAccessKey'));
    } else if (accessToken !== undefined) {
      tokenContents = verifyAccessToken(
        accessToken,
        req.app.get('jwtAccessKey')
      );
    } else {
      throw new UnauthenticatedError();
    }

    // Check request body
    let calledUserStatus: 'self' | 'other' | 'serverAdmin';
    const requestUserEmail = Buffer.from(
      req.params.base64Email,
      'base64url'
    ).toString('utf8');
    if (!validateEmail(requestUserEmail)) {
      throw new NotFoundError();
    }
    if (tokenContents !== undefined) {
      calledUserStatus =
        tokenContents.id === requestUserEmail
          ? (calledUserStatus = 'self')
          : (calledUserStatus = 'other');
    } else {
      calledUserStatus = 'serverAdmin';
    }

    // DB operation - Get user information
    const requestUser = await User.read(dbClient, requestUserEmail);
    const userProfileResponseObj: UserProfileResponseObj = {
      nickname: requestUser.nickname,
      major: requestUser.major,
      graduationYear: requestUser.graduationYear,
    };
    if (calledUserStatus !== 'other') {
      userProfileResponseObj.lastLogin = (
        requestUser.lastLogin as Date
      ).toISOString();
      userProfileResponseObj.nicknameChanged = (
        requestUser.nicknameChanged as Date
      ).toISOString();
    }
    if (calledUserStatus === 'serverAdmin') {
      userProfileResponseObj.signUpDate = (
        requestUser.signUpDate as Date
      ).toISOString();
      userProfileResponseObj.deleted = requestUser.deleted;
      if (requestUser.deleted) {
        userProfileResponseObj.deletedAt = (
          requestUser.deletedAt as Date
        ).toISOString();
      }
      userProfileResponseObj.locked = requestUser.locked;
      if (requestUser.locked) {
        userProfileResponseObj.lockedDescription =
          requestUser.lockedDescription;
        userProfileResponseObj.lockedAt = (
          requestUser.lockedAt as Date
        ).toISOString();
      }
      userProfileResponseObj.tncVersion = requestUser.tncVersion;
    }
    res.status(200).json(userProfileResponseObj);
  } catch (e) {
    next(e);
  }
});

// // POST: /user/profile/{base64Email}/accepttnc
// userRouter.post('/profile/:base64Email/accepttnc', async (req, res, next) => {
//   // TODO
// });

// POST: /user/profile/{base64Email}/lastlogin
userRouter.post('/profile/:base64Email/lastlogin', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Header check - serverAdminToken
    const serverToken = req.header('X-SERVER-TOKEN');
    if (serverToken === undefined) {
      throw new UnauthenticatedError();
    }
    const tokenContents = verifyServerAdminToken(
      serverToken,
      req.app.get('jwtAccessKey')
    );
    // Check if token is from authentication server
    if (tokenContents.accountType !== 'server - authentication') {
      throw new ForbiddenError();
    }

    // Check parameter
    const requestUserEmail = Buffer.from(
      req.params.base64Email,
      'base64url'
    ).toString('utf8');

    if (!validateEmail(requestUserEmail)) {
      throw new NotFoundError();
    }

    // Check request body
    const lastLoginRequest: {lastLogin: string} = req.body;
    if (!validateLastLoginRequest(lastLoginRequest)) {
      throw new BadRequestError();
    }
    lastLoginRequest.lastLogin = new Date(
      lastLoginRequest.lastLogin
    ).toISOString();

    const user = await User.read(dbClient, requestUserEmail);
    if (user.deleted || user.locked) {
      throw new ConflictError();
    }

    // update User lastLogin with requested email
    await User.updateLastLogin(
      dbClient,
      requestUserEmail,
      lastLoginRequest.lastLogin
    );

    // response
    res.status(200).send();
  } catch (e) {
    next(e);
  }
});

// // POST: /user/profile/{base64Email}/lock
// userRouter.post('/profile/:base64Email/lock', async (req, res, next) => {
//   // TODO
// });

// GET: /user/check-nickname
userRouter.get('/check-nickname', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Header check - access token
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken === undefined) {
      throw new UnauthenticatedError();
    }
    verifyAccessToken(accessToken, req.app.get('jwtAccessKey'));

    // Check request body
    const nicknameVerifyRequest: {nickname: string} = req.body;
    if (!validateVerifyNicknameRequest(nicknameVerifyRequest)) {
      throw new BadRequestError();
    }

    // DB operation - check nickname availability
    const available = await User.readCheckNickname(
      dbClient,
      nicknameVerifyRequest.nickname
    );

    res.status(200).json({isAvailable: available});
  } catch (e) {
    next(e);
  }
});

export default userRouter;
