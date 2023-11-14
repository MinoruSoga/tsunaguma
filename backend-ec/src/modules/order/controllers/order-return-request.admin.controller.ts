import { OrderStatus } from '@medusajs/medusa'
import { NextFunction, Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { StorePlanType } from '../../store/entity/store.entity'
import { Order } from '../entity/order.entity'
import { OrderService } from '../services/order.service'

export default async function (
  req: MedusaRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const orderService = req.scope.resolve<OrderService>('orderService')
    const orderId = req.params.id

    const order = (await orderService.retrieve(orderId, {
      select: ['id', 'status'],
      relations: ['store'],
    })) as Order

    if (order) {
      if (
        order.status === OrderStatus.COMPLETED ||
        order.store?.plan_type !== StorePlanType.PRIME
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'This order can not be returned !!!',
        )
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}
