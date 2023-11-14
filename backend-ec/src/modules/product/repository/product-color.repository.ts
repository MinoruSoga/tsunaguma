import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductColor } from '../entity/product-color.entity'

@MedusaRepository()
@EntityRepository(ProductColor)
export class ProductColorRepository extends Repository<ProductColor> {}
