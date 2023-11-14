import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ReturnHistory } from '../entities/return-history.entity'

@MedusaRepository()
@EntityRepository(ReturnHistory)
export class ReturnHistoryRepository extends Repository<ReturnHistory> {}
