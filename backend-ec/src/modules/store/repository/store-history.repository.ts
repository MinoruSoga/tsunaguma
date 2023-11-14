import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { StoreHistory } from '../entity/store-history.entity'

@MedusaRepository()
@EntityRepository(StoreHistory)
export class StoreHistoryRepository extends Repository<StoreHistory> {}
