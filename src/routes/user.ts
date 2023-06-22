/**
 * Express Router middlewhare for User APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import User from '../datatypes/User/User';
import { validateVerifyNicknameRequest } from '../functions/inputValidator/validateVerifyNicknameRequest';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';

// Path: /user
const userRouter = express.Router();

// // POST: /user
// userRouter.post('/', async (req, res, next) => {
//   // TODO
// });

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

    // Header check - serverAdminToken
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken === undefined) {
      throw new UnauthenticatedError();
    }
    verifyAccessToken(accessToken, req.app.get('jwtAccessKey'));

    // Check request body
    const nicknameVerifyRequest: { nickname: string } = req.body;
    if (!validateVerifyNicknameRequest(nicknameVerifyRequest)) {
      throw new BadRequestError();
    }

    // DB operation - check nickname availability
    let nicknames: string[] = [];
    nicknames = await User.readNicknames(dbClient);

    let available = true;
    if (nicknames.length !== 0) {
      for (const nickname of nicknames) {
        if (nickname === nicknameVerifyRequest.nickname) {
          available = false;
          break;
        }
      }
    }
    res.status(200).json({ isAvailable: available });
  } catch (e) {
    next(e);
  }
});

export default userRouter;
