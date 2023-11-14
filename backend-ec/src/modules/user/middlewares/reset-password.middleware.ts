import { NextFunction, Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import {
  MedusaAuthenticatedRequest,
  MedusaMiddleware,
  Middleware,
} from 'medusa-extender'

import { User } from '../entity/user.entity'
import UserService from '../services/user.service'

@Middleware({
  requireAuth: false,
  routes: [{ method: 'all', path: '/admin/users/forgot-password/:token' }],
})
export class ResetPasswordMiddleware implements MedusaMiddleware {
  public async consume(
    req: MedusaAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.params
      const userService = req.scope.resolve('userService') as UserService

      // currently using the same decode function as register
      // need to be changed
      const payload = userService.decodeRegisterToken(token)
      if (!payload || !payload.email) {
        return next(
          new MedusaError(MedusaError.Types.INVALID_DATA, 'invalid token'),
        )
      }

      const user = (await userService.retrieveByEmail(payload.email)) as User

      if (!user || user.reset_password_token !== token)
        return next(
          new MedusaError(MedusaError.Types.INVALID_DATA, 'invalid token'),
        )

      req.scope.register({
        resetPasswordUser: {
          resolve: () => payload,
        },
      })
      next()
    } catch (error) {
      next(error)
    }
  }
}
