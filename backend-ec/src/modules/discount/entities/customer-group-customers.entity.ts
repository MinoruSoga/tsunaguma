import { CustomerGroup } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

import { Customer } from '../../../modules/user/entity/customer.entity'

@MedusaEntity()
@Entity()
export class CustomerGroupCustomers {
  @PrimaryColumn({ type: 'varchar' })
  customer_group_id: string

  @PrimaryColumn({ type: 'varchar' })
  customer_id: string

  @ManyToOne(() => CustomerGroup, (customerGroup) => customerGroup.id)
  @JoinColumn({ name: 'customer_group_id', referencedColumnName: 'id' })
  customer_group: CustomerGroup

  @ManyToOne(() => Customer, (store) => store.id)
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'id' })
  customer: Customer

  used_at?: string
  released_at?: string
}

/**
 * @schema customer_group_customers
 * title: "CustomerGroupCustomers"
 * description: "Relations of customer group and customer"
 * x-resourceId: customer_group_customers
 * required:
 *   - customer_group_id
 *   - customer_id
 * properties:
 *   customer_group_id:
 *     type: string
 *     description: Id of customer group
 *   customer_id:
 *     type: string
 *     description: Id of customer
 *   customer_group:
 *     $ref: "#/components/schemas/customer_group"
 *   customer:
 *     $ref: "#/components/schemas/customer"
 *   used_at:
 *     type: string
 *   released_at:
 *     type: string
 */
