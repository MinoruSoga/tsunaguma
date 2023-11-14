import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductAddon } from '../entity/product-addon.entity'

@MedusaRepository()
@EntityRepository(ProductAddon)
export class ProductAddonRepository extends Repository<ProductAddon> {}
