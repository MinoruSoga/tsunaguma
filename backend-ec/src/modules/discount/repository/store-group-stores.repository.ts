import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { StoreGroupStores } from '../entities/store-group-stores.entity'

@MedusaRepository()
@EntityRepository(StoreGroupStores)
export class StoreGroupStoresRepository extends Repository<StoreGroupStores> {}
