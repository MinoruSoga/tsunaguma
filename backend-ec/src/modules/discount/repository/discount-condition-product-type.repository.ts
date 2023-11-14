import { DiscountConditionProductType } from '@medusajs/medusa'
import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

@MedusaRepository()
@EntityRepository(DiscountConditionProductType)
export class DiscountConditionProductTypeRepository extends Repository<DiscountConditionProductType> {}
