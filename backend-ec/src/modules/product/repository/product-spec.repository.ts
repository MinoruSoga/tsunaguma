import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductSpec } from '../entity/product-spec.entity'

@MedusaRepository()
@EntityRepository(ProductSpec)
export class ProductSpecRepository extends Repository<ProductSpec> {}
