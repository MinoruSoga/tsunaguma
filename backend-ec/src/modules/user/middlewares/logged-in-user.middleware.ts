import { NextFunction, Response } from 'express'
import {
  MedusaAuthenticatedRequest,
  MedusaMiddleware,
  Middleware,
} from 'medusa-extender'

@Middleware({
  requireAuth: true,
  routes: [
    { method: 'all', path: '/admin/*' },
    { method: 'all', path: '/store/*' },
  ],
})
export class LoggedInUserMiddleware implements MedusaMiddleware {
  public async consume(
    req: MedusaAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let loggedInUser = null

    const requestUser: any = req.user

    if (requestUser && (requestUser.id || requestUser.userId)) {
      const userId = requestUser.id ?? requestUser.userId

      req.user = { ...requestUser, id: userId, userId, customer_id: userId }
      loggedInUser = requestUser.data
    }

    req.scope.register({
      loggedInUser: {
        resolve: () => loggedInUser,
      },
    })
    next()
  }
}
