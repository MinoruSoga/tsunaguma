import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { StoreDetail } from '../entity/store-detail.entity'

@MedusaRepository()
@EntityRepository(StoreDetail)
export class StoreDetailRepository extends Repository<StoreDetail> {}
