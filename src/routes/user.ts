/**
 * Express Router middlewhare for User APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import User from '../datatypes/User/User';
import {validateVerifyNicknameRequest} from '../functions/inputValidator/validateVerifyNicknameRequest';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import NotFoundError from '../exceptions/NotFoundError';
import formatUserProfileResponseObj from '../functions/responseFormatter/formatUserProfileResponseObj';
import AuthToken from '../datatypes/Token/AuthToken';
import verifyServerAdminToken from '../functions/JWT/verifyServerAdminToken';

// Path: /user
const userRouter = express.Router();

// // POST: /user
// userRouter.post('/', async (req, res, next) => {
//   // TODO
// });

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
    if (serverToken !== undefined) {
      verifyServerAdminToken(serverToken, req.app.get('jwtAccessKey'));
    } else {
      const accessToken = req.header('X-ACCESS-TOKEN');
      if (accessToken === undefined) {
        throw new UnauthenticatedError();
      }
      tokenContents = verifyAccessToken(
        accessToken,
        req.app.get('jwtAccessKey')
      );
    }

    // DB operation - Get user information
    let calledUserStatus: string;
    const requestUserEmail = req.params.base64Email;
    if (tokenContents !== undefined) {
      if (tokenContents.id === requestUserEmail) {
        calledUserStatus = 'self';
      } else {
        calledUserStatus = 'other';
      }
    } else {
      calledUserStatus = 'serverAdmin';
    }

    const requestUser = await User.read(dbClient, requestUserEmail);
    if (requestUser === undefined) {
      throw new NotFoundError();
    }

    // Response
    const responseUser = formatUserProfileResponseObj(
      requestUser,
      calledUserStatus
    );
    res.status(200).json(responseUser);
  } catch (e) {
    next(e);
  }
});

// // POST: /user/profile/{base64Email}/accepttnc
// userRouter.post('/:base64Email/accepttnc', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/profile/{base64Email}/lastlogin
// userRouter.post('/:base64Email/lastlogin', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/profile/{base64Email}/lock
// userRouter.post('/:base64Email/lock', async (req, res, next) => {
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
    const available = await User.checkNickname(
      dbClient,
      nicknameVerifyRequest.nickname
    );

    res.status(200).json({isAvailable: available});
  } catch (e) {
    next(e);
  }
});

export default userRouter;
