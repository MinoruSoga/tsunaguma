import { NextFunction, Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import {
  MedusaAuthenticatedRequest,
  MedusaMiddleware,
  Middleware,
} from 'medusa-extender'

import { StoreStatus } from '../../store/entity/store.entity'
import StoreService from '../../store/services/store.service'
import { UserType } from '../entity/user.entity'
import UserService from '../services/user.service'

@Middleware({
  requireAuth: true,
  routes: [
    { method: 'all', path: '/_admin/store/product-addon' },
    { method: 'all', path: '/_admin/store/product-addon/:id' },
    { method: 'all', path: '/_admin/shipping-option' },
    { method: 'all', path: '/_admin/shipping-option/:id' },
  ],
})
export class StoreStandardMiddleware implements MedusaMiddleware {
  public async consume(
    req: MedusaAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userService = req.scope.resolve('userService') as UserService
      const storeService = req.scope.resolve('storeService') as StoreService
      const loggedInUser = await userService.retrieve(req.user.userId, {
        select: ['id', 'type', 'store_id'],
      })

      const store = await storeService.retrieve_(loggedInUser.store_id, {
        select: ['id', 'status', 'owner_id'],
      })

      const allowedType = [UserType.STORE_STANDARD]

      if (
        !allowedType.includes(loggedInUser.type) ||
        !(store.status === StoreStatus.APPROVED) ||
        !(store.owner_id === loggedInUser.id)
      ) {
        return next(
          new MedusaError(MedusaError.Types.NOT_ALLOWED, 'unauthorized'),
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
