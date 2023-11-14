import { DiscountRuleRepository as MedusaDiscountRuleRepository } from '@medusajs/medusa/dist/repositories/discount-rule'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { DiscountRule } from '../entities/discount-rule.entity'

@MedusaRepository({ override: MedusaDiscountRuleRepository })
@EntityRepository(DiscountRule)
export class DiscountRuleRepository extends Utils.repositoryMixin<
  DiscountRule,
  MedusaDiscountRuleRepository
>(MedusaDiscountRuleRepository) {}
