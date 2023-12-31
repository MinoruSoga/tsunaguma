import { NextFunction, Response } from 'express'
import {
  MEDUSA_RESOLVER_KEYS,
  MedusaAuthenticatedRequest,
  MedusaMiddleware,
  Middleware,
  Utils as MedusaUtils,
} from 'medusa-extender'
import { Connection } from 'typeorm'

import UserSubscriber from '../subscribers/user.subscriber'

@Middleware({
  requireAuth: false,
  routes: [
    { method: 'post', path: '/admin/users' },
    { method: 'post', path: '/admin/create-user' },
  ],
})
export class AttachUserSubscriberMiddleware implements MedusaMiddleware {
  public async consume(
    req: MedusaAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { connection } = req.scope.resolve(MEDUSA_RESOLVER_KEYS.manager) as {
      connection: Connection
    }
    MedusaUtils.attachOrReplaceEntitySubscriber(connection, UserSubscriber)
    return next()
  }
}
