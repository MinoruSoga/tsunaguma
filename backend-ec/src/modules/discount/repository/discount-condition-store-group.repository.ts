import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { DiscountConditionStoreGroup } from '../entities/discount-condition-store-group.entity'

@MedusaRepository()
@EntityRepository(DiscountConditionStoreGroup)
export class DiscountConditionStoreGroupRepository extends Repository<DiscountConditionStoreGroup> {}
