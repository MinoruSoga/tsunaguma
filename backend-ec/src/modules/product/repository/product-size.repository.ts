import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductSize } from '../entity/product-size.entity'

@MedusaRepository()
@EntityRepository(ProductSize)
export class ProductSizeRepository extends Repository<ProductSize> {}
