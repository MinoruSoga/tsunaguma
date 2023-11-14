import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { StoreFavorite } from '../entities/store-favorite.entity'

@MedusaRepository()
@EntityRepository(StoreFavorite)
export class StoreFavoriteRepository extends Repository<StoreFavorite> {}
