import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductReviews } from '../entity/product-reviews.entity'

@MedusaRepository()
@EntityRepository(ProductReviews)
export class ProductReviewsRepository extends Repository<ProductReviews> {}
