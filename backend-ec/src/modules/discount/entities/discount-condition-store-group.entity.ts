import { DiscountCondition } from '@medusajs/medusa'
import {
  DbAwareColumn,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { StoreGroup } from './store-group.entity'

@MedusaEntity()
@Entity()
export class DiscountConditionStoreGroup {
  @PrimaryColumn()
  store_group_id: string

  @PrimaryColumn()
  condition_id: string

  @ManyToOne(() => StoreGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_group_id' })
  store_group?: StoreGroup

  @ManyToOne(() => DiscountCondition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condition_id' })
  discount_condition?: DiscountCondition

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>
}
/**
 * @schema discount_condition_store_group
 * title: "Product Tag Discount Condition"
 * description: "Associates a discount condition with a store group"
 * x-resourceId: discount_condition_store_group
 * required:
 *   - store_group_id
 *   - condition_id
 * properties:
 *   store_group_id:
 *     description: "The ID of the Product Tag"
 *     type: string
 *     example: cgrp_01G8ZH853Y6TFXWPG5EYE81X63
 *   condition_id:
 *     description: "The ID of the Discount Condition"
 *     type: string
 *     example: discon_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   store_group:
 *     description: Available if the relation `customer_group` is expanded.
 *     $ref: "#/components/schemas/store_group"
 *   discount_condition:
 *     description: Available if the relation `discount_condition` is expanded.
 *     $ref: "#/components/schemas/discount_condition"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 */
