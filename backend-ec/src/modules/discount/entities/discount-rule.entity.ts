import { DiscountRule as MedusaDiscountRule } from '@medusajs/medusa/dist/models'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Entity, OneToMany } from 'typeorm'

import { DiscountCondition } from './discount-condition.entity'

@MedusaEntity({ override: MedusaDiscountRule })
@Entity()
export class DiscountRule extends MedusaDiscountRule {
  @OneToMany(() => DiscountCondition, (conditions) => conditions.discount_rule)
  conditions: DiscountCondition[]
}
