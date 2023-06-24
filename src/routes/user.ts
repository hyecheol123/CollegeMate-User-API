/**
 * Express Router middlewhare for User APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import User from '../datatypes/User/User';
import UserPostRequestObj from '../datatypes/User/UserPostRequestObj';
import getTnC from '../datatypes/TNC/getTnC';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';
import ConflictError from '../exceptions/ConflictError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import {validateUserPostRequest} from '../functions/inputValidator/validateUserPostRequest';
import {validateVerifyNicknameRequest} from '../functions/inputValidator/validateVerifyNicknameRequest';

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

// // DELETE: /user/{base64Email}
// userRouter.delete('/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // PATCH: /user/{base64Email}
// userRouter.patch('/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // GET: /user/{base64Email}
// userRouter.get('/:base64Email', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/{base64Email}/accepttnc
// userRouter.post('/:base64Email/accepttnc', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/{base64Email}/lastlogin
// userRouter.post('/:base64Email/lastlogin', async (req, res, next) => {
//   // TODO
// });

// // POST: /user/{base64Email}/lock
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
