import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { Store } from './store.entity'

@MedusaEntity()
@Entity()
export class StoreHistory extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store?: Store

  @Column({ type: 'varchar', nullable: false })
  created_by: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  creator?: User

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: object

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'store_his')
  }
}
/**
 * @schema store_history
 * title: "Store History"
 * description: "History of a store."
 * x-resourceId: store_history
 * required:
 *   - created_by
 *   - store_id
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
 *  store_id:
 *     type: string
 *     description: The user's ID
 *  store:
 *     description: Available if the relation `user` is expanded.
 *     $ref: "#/components/schemas/store"
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
