import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { User } from './../../user/entity/user.entity'
import { Discount } from './discount.entity'

@MedusaEntity()
@Entity()
export class UserDiscount {
  @PrimaryColumn({ type: 'varchar' })
  user_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @PrimaryColumn({ type: 'varchar' })
  discount_id: string

  @ManyToOne(() => Discount)
  @JoinColumn({ name: 'discount_id', referencedColumnName: 'id' })
  discount: Discount

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date
}

/**
 * @schema user_discount
 * title: "User Discount"
 * description: "Tracking user discount usage."
 * x-resourceId: user_discount
 * required:
 *   - user_id
 *   - discount_id
 * properties:
 *   user_id:
 *     type: string
 *     description: The user's ID
 *     example: user_01G749BFYR6T8JTVW6SGW3K3E6
 *   user:
 *     description: Available if the relation `user_id` is expanded.
 *     $ref: "#/components/schemas/user"
 *   discount_id:
 *     type: string
 *     description: The discount's ID
 *     example: discount_01G749BFYR6T8JTVW6SGW3K3E6
 *   discount:
 *     description: Available if the relation `discount_id` is expanded.
 *     $ref: "#/components/schemas/discount"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
