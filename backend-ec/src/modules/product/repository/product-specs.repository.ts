import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductSpecs } from '../entity/product-specs.entity'

@MedusaRepository()
@EntityRepository(ProductSpecs)
export class ProductSpecsRepository extends Repository<ProductSpecs> {}
