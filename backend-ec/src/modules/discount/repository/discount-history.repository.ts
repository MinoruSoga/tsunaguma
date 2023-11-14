import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { DiscountHistory } from '../entities/discount-history.entity'

@MedusaRepository()
@EntityRepository(DiscountHistory)
export class DiscountHistoryRepository extends Repository<DiscountHistory> {}
