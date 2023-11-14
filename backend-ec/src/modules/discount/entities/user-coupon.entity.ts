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

import { User } from '../../user/entity/user.entity'
import { Discount } from './discount.entity'

@MedusaEntity()
@Entity()
export class UserCoupon {
  @PrimaryColumn()
  user_id: string

  @PrimaryColumn()
  discount_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User

  @ManyToOne(() => Discount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discount_id' })
  discount?: Discount

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>
}

/**
 * @schema user_coupon
 * title: "User coupon"
 * description: "User coupon"
 * x-resourceId: user_coupon
 * required:
 *   - user_id
 *   - discount_id
 * properties:
 *   user_id:
 *     description: "The ID of the Product Tag"
 *     type: string
 *     example: cgrp_01G8ZH853Y6TFXWPG5EYE81X63
 *   discount_id:
 *     description: "The ID of the Discount Condition"
 *     type: string
 *     example: dis_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   user:
 *     $ref: "#/components/schemas/user"
 *   discount:
 *     $ref: "#/components/schemas/discount"
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
