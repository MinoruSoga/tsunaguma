import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductColors } from '../entity/product-colors.entity'

@MedusaRepository()
@EntityRepository(ProductColors)
export class ProductColorsRepository extends Repository<ProductColors> {}
