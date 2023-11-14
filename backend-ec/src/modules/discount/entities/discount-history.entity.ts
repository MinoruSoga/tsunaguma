import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { Discount } from './discount.entity'

@MedusaEntity()
@Entity()
export class DiscountHistory extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  discount_id: string

  @ManyToOne(() => Discount, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'discount_id', referencedColumnName: 'id' })
  discount?: Discount

  @Column({ type: 'varchar', nullable: false })
  created_by: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  creator?: User

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: object

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'disc_his')
  }
}
/**
 * @schema discount_history
 * title: "Discount History"
 * description: "History of a discount."
 * x-resourceId: discount_history
 * required:
 *   - created_by
 *   - discount_id
 * properties:
 *  id:
 *    type: string
 *    description: ID of the reaction
 *    example: prod_reaction_01G8ZC9VS1XVE149MGH2J7QSSH
 *  created_by:
 *     type: string
 *     description: The user's ID
 *  creator:
 *     description: Available if the relation `user` is expanded.
 *     $ref: "#/components/schemas/user"
 *  discount_id:
 *     type: string
 *     description: The discount's ID
 *  discount:
 *     description: Available if the relation `user` is expanded.
 *     $ref: "#/components/schemas/discount"
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 */
