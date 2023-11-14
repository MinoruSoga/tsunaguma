import { SoftDeletableEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import {
  DbAwareColumn,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  UpdateDateColumn,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'

@MedusaEntity()
@Entity()
export class StoreGroup extends SoftDeletableEntity {
  @Index({ unique: true, where: 'deleted_at IS NULL' })
  @Column()
  name: string

  @ManyToMany(() => Store, (store) => store.groups, {
    onDelete: 'CASCADE',
  })
  stores: Store[]

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'sgrp')
  }
}
/**
 * @schema store_group
 * title: "Store Group"
 * description: "Represents a store group"
 * x-resourceId: store_group
 * properties:
 *   id:
 *     type: string
 *     description: The customer group's ID
 *     example: cgrp_01G8ZH853Y6TFXWPG5EYE81X63
 *   name:
 *     type: string
 *     description: The name of the customer group
 *     example: VIP
 *   stores:
 *     type: array
 *     description: The customers that belong to the customer group. Available if the relation `customers` is expanded.
 *     items:
 *       type: object
 *       description: A customer object.
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   deleted_at:
 *     type: string
 *     description: "The date with timezone at which the resource was deleted."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 */
