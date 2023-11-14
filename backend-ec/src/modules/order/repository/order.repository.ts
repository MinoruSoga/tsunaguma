import { OrderRepository as MedusaOrderRepository } from '@medusajs/medusa/dist/repositories/order'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { Order } from '../entity/order.entity'

@MedusaRepository({ override: MedusaOrderRepository })
@EntityRepository(Order)
export class OrderRepository extends Utils.repositoryMixin<
  Order,
  MedusaOrderRepository
>(MedusaOrderRepository) {}
