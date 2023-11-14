import { NextFunction, Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import {
  MedusaAuthenticatedRequest,
  MedusaMiddleware,
  Middleware,
} from 'medusa-extender'

import UserService from '../services/user.service'

@Middleware({
  requireAuth: false,
  routes: [{ method: 'all', path: '/admin/users/register/:token' }],
})
export class RegisterMiddleware implements MedusaMiddleware {
  public async consume(
    req: MedusaAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.params
      const userService = req.scope.resolve('userService') as UserService
      const payload = userService.decodeRegisterToken(token)
      if (!payload || !payload.email) {
        return next(
          new MedusaError(MedusaError.Types.INVALID_DATA, 'invalid token'),
        )
      }

      const user = await userService.retrieveByEmail(
        payload.email,
        { select: ['id'] },
        false,
      )
      if (user)
        return next(
          new MedusaError(MedusaError.Types.INVALID_DATA, 'invalid token'),
        )

      req.scope.register({
        registeredUser: {
          resolve: () => payload,
        },
      })
      next()
    } catch (error) {
      next(error)
    }
  }
}
