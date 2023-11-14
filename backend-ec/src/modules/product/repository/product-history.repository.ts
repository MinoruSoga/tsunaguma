import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductHistory } from '../entity/product-history.entity'

@MedusaRepository()
@EntityRepository(ProductHistory)
export class ProductHistoryRepository extends Repository<ProductHistory> {}
