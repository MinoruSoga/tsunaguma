import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { DeliveryRequestHistory } from '../entities/delivery-request-history.entity'

@MedusaRepository()
@EntityRepository(DeliveryRequestHistory)
export class DeliveryRequestHistoryRepository extends Repository<DeliveryRequestHistory> {}
