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
import verifyServerAdminToken from '../functions/JWT/verifyServerAdminToken';
import {validateLockUserRequest} from '../functions/inputValidator/validateLockUserRequest';
import ConflictError from '../exceptions/ConflictError';

// Path: /user
const userRouter = express.Router();

// // POST: /user
// userRouter.post('/', async (req, res, next) => {
//   // TODO
// });

// // DELETE: /user/profile/{base64Email}
// userRouter.delete('/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // PATCH: /user/profile/{base64Email}
// userRouter.patch('/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // GET: /user/profile/{base64Email}
// userRouter.get('/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/profile/{base64Email}/accepttnc
// userRouter.post('/:base64Email/accepttnc', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/profile/{base64Email}/lastlogin
// userRouter.post('/:base64Email/lastlogin', async (req, res, next) => {
//   // TODO
// });

// POST: /user/profile/{base64Email}/lock
userRouter.post('/profile/:base64Email/lock', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Header check - access token or Origin header or application key
    const serverToken = req.header('X-SERVER-TOKEN');
    if (serverToken === undefined) {
      throw new UnauthenticatedError();
    }
    verifyServerAdminToken(serverToken, req.app.get('jwtAccessKey'));

    const requestUserEmail = req.params.base64Email;

    // Check request body
    const lockUserRequest: {description: string} = req.body;
    if (!validateLockUserRequest(lockUserRequest)) {
      throw new BadRequestError();
    }

    // lock User with requested email
    if ((await User.read(dbClient, requestUserEmail)).locked) {
      throw new ConflictError();
    }
    await User.lock(dbClient, requestUserEmail, lockUserRequest.description);

    // Send email/notification to user
    // TODO: GraphQL + Modules needed to implement this feature
    // TODO: Implement email sending feature and notification feature

    // response
    res.status(200).send();
  } catch (e) {
    next(e);
  }
});

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
