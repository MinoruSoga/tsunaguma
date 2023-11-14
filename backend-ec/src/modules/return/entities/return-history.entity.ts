import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { Return } from './return.entity'

@MedusaEntity()
@Entity()
export class ReturnHistory extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  return_id: string

  @ManyToOne(() => Return, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'return_id', referencedColumnName: 'id' })
  return?: Return

  @Column({ type: 'varchar', nullable: false })
  created_by: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  creator?: User

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: object

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'rtn_his')
  }
}

/**
 * @schema return_history
 * title: "Return History"
 * description: "Return history."
 * x-resourceId: return_history
 * required:
 *   - created_by
 *   - return_id
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
 *  return_id:
 *     type: string
 *     description: The delivery request ID
 *  return:
 *     description: Available if the relation `user` is expanded.
 *     $ref: "#/components/schemas/delivery_request"
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
