import { NextFunction, Request, Response } from 'express'
import {
  MEDUSA_RESOLVER_KEYS,
  MedusaAuthenticatedRequest,
  MedusaMiddleware,
  Middleware,
  Utils as MedusaUtils,
} from 'medusa-extender'
import { Connection } from 'typeorm'

import ImageSubscriber from '../subscribers/image.subscriber'

@Middleware({
  requireAuth: true,
  routes: [
    { method: 'post', path: '/admin/products' },
    { method: 'post', path: '/admin/products/:id' },
  ],
})
export default class AttachImageSubscribersMiddleware
  implements MedusaMiddleware
{
  public consume(
    req: MedusaAuthenticatedRequest | Request,
    res: Response,
    next: NextFunction,
  ): void | Promise<void> {
    const { connection } = req.scope.resolve(MEDUSA_RESOLVER_KEYS.manager) as {
      connection: Connection
    }
    MedusaUtils.attachOrReplaceEntitySubscriber(connection, ImageSubscriber)
    return next()
  }
}
