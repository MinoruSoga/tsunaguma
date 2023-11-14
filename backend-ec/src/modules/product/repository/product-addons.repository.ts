import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductAddons } from '../entity/product-addons.entity'

@MedusaRepository()
@EntityRepository(ProductAddons)
export class ProductAddonsRepository extends Repository<ProductAddons> {}
