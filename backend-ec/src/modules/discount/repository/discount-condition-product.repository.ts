import { DiscountConditionProduct } from '@medusajs/medusa'
import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

@MedusaRepository()
@EntityRepository(DiscountConditionProduct)
export class DiscountConditionProductRepository extends Repository<DiscountConditionProduct> {}
