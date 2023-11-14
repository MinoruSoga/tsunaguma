import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductShippingOptions } from '../entity/product-shipping-options.entity'

@MedusaRepository()
@EntityRepository(ProductShippingOptions)
export class ProductShippingOptionsRepository extends Repository<ProductShippingOptions> {}
