import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ViewedProduct } from '../entity/viewed-product.entity'

@MedusaRepository()
@EntityRepository(ViewedProduct)
export class ViewedProductRepository extends Repository<ViewedProduct> {}
