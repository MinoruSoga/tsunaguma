import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { OrderDiscounts } from '../entities/order-discounts.entity'

@MedusaRepository()
@EntityRepository(OrderDiscounts)
export class OrderDiscountsRepository extends Repository<OrderDiscounts> {}
