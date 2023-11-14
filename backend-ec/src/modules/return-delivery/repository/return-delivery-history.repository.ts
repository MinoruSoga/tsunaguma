import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ReturnDeliveryHistory } from '../entities/return-delivery-history.entity'

@MedusaRepository()
@EntityRepository(ReturnDeliveryHistory)
export class ReturnDeliveryHistoryRepository extends Repository<ReturnDeliveryHistory> {}
