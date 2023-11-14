import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductFavorite } from '../entities/product-favorite.entity'

@MedusaRepository()
@EntityRepository(ProductFavorite)
export class ProductFavoriteRepository extends Repository<ProductFavorite> {}
