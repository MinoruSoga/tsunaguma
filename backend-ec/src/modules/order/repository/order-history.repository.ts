import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { OrderHistory } from '../entity/order-history.entity'

@MedusaRepository()
@EntityRepository(OrderHistory)
export class OrderHistoryRepository extends Repository<OrderHistory> {}
