import { Discount as MedusaDiscount } from '@medusajs/medusa/dist/models'
import {
  DbAwareColumn,
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { User } from '../../user/entity/user.entity'
import { DiscountRule } from './discount-rule.entity'

export enum DiscountType {
  POINT = 'point',
  COUPON = 'coupon',
  PROMO_CODE = 'promo_code',
}

/**
 * @schema DiscountTypeEnum
 * title: "DiscountTypeEnum"
 * description: "The list of type of the Discount"
 * x-resourceId: DiscountTypeEnum
 * type: string
 * enum:
 *   - point
 *   - coupon
 *   - promo_code
 */

/**
 * @schema StoreApplyEnum
 * title: "StoreApplyEnum"
 * description: "The list of type of the Discount"
 * x-resourceId: StoreApplyEnum
 * type: string
 * enum:
 *   - csv
 *   - all
 *   - store
 */
export enum StoreApplyEnum {
  CSV = 'csv',
  ALL = 'all',
  STORE = 'store',
}

/**
 * @schema AvailableStatusEnum
 * title: "AvailableStatusEnum"
 * description: "The list of type of the Discount"
 * x-resourceId: AvailableStatusEnum
 * type: string
 * enum:
 *   - expired
 *   - took
 *   - open
 */
export enum AvailableStatusEnum {
  EXPIRED = 'expired',
  TOOK = 'took',
  OPEN = 'open',
}

/**
 * @schema IssuanceTimingEnum
 * title: "IssuanceTimingEnum"
 * description: "The list of type of the Discount"
 * x-resourceId: IssuanceTimingEnum
 * type: string
 * enum:
 *   - none
 *   - member_register
 *   - follow
 *   - birth_month
 *   - after_ordering
 *   - reviewed
 *   - favorite
 */
export enum IssuanceTimingEnum {
  NONE = 'none',
  MEMBER_REGISTER = 'member_register',
  FOLLOW = 'follow',
  BIRTH_MONTH = 'birth_month',
  AFTER_ORDERING = 'after_ordering',
  REVIEWED = 'reviewed',
  FAVORITE = 'favorite',
}

/**
 * @schema DiscountStatus
 * title: "DiscountStatus"
 * description: "The list of status of the Discount"
 * x-resourceId: DiscountStatus
 * type: string
 * enum:
 *   - draft
 *   - published
 *   - deleted
 */

export enum DiscountStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DELETED = 'deleted',
}

@MedusaEntity({ override: MedusaDiscount })
@Entity()
export class Discount extends MedusaDiscount {
  @ManyToOne(() => DiscountRule, { cascade: true })
  @JoinColumn({ name: 'rule_id' })
  rule: DiscountRule

  @DbAwareColumn({ type: 'enum', enum: DiscountType, nullable: true })
  type: DiscountType

  @Column({ nullable: true })
  parent_discount_id: string

  @ManyToOne(() => Discount, { eager: true })
  @JoinColumn({ name: 'parent_discount_id' })
  parent_discount: Discount

  @Column({ type: 'varchar', nullable: true })
  store_id: string | null

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ type: 'varchar', nullable: true })
  owner_store_id: string | null

  @Column({ type: 'varchar', nullable: true })
  title: string

  @Column({ type: 'varchar', nullable: true })
  thumbnail: string

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  owner_store: Store

  @ManyToMany(() => User, { cascade: ['insert'] })
  @JoinTable({
    name: 'user_discount',
    joinColumn: {
      name: 'discount_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  users: User[]

  @Column({ type: 'bool', nullable: false })
  is_sale: boolean

  @Column({ type: 'varchar', nullable: true })
  terms_of_use: string

  @Column({ type: 'integer', nullable: true })
  payback_rate: number

  @DbAwareColumn({ type: 'enum', enum: StoreApplyEnum, nullable: true })
  store_apply: StoreApplyEnum

  @DbAwareColumn({ type: 'enum', enum: IssuanceTimingEnum, nullable: true })
  issuance_timing: IssuanceTimingEnum

  @Column({ type: 'integer', nullable: true })
  amount_limit: number

  @Column({ type: 'bool', nullable: false })
  is_target_user: boolean

  @DbAwareColumn({ type: 'enum', enum: DiscountStatus, nullable: true })
  status: DiscountStatus

  available_status?: AvailableStatusEnum

  @Column({ nullable: true, type: resolveDbType('timestamptz') })
  released_at: Date

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ type: 'varchar', nullable: true })
  store_target_group: string
}

/**
 * @schema discount
 * title: "Discount"
 * description: "Represents a discount that can be applied to a cart for promotional purposes."
 * x-resourceId: discount
 * required:
 *   - code
 *   - is_dynamic
 * properties:
 *   id:
 *     type: string
 *     description: The discount's ID
 *     example: disc_01F0YESMW10MGHWJKZSDDMN0VN
 *   code:
 *     description: "A unique code for the discount - this will be used by the customer to apply the discount"
 *     type: string
 *     example: 10DISC
 *   is_dynamic:
 *     description: "A flag to indicate if multiple instances of the discount can be generated. I.e. for newsletter discounts"
 *     type: boolean
 *     example: false
 *   rule_id:
 *     type: string
 *     description: "The Discount Rule that governs the behaviour of the Discount"
 *     example: dru_01F0YESMVK96HVX7N419E3CJ7C
 *   rule:
 *     description: Available if the relation `rule` is expanded.
 *     $ref: "#/components/schemas/discount_rule"
 *   is_disabled:
 *     description: "Whether the Discount has been disabled. Disabled discounts cannot be applied to carts"
 *     type: boolean
 *     example: false
 *   parent_discount_id:
 *     type: string
 *     description: "The Discount that the discount was created from. This will always be a dynamic discount"
 *     example: disc_01G8ZH853YPY9B94857DY91YGW
 *   parent_discount:
 *     description: Available if the relation `parent_discount` is expanded.
 *     $ref: "#/components/schemas/discount"
 *   starts_at:
 *     description: "The time at which the discount can be used."
 *     type: string
 *     format: date-time
 *   ends_at:
 *     description: "The time at which the discount can no longer be used."
 *     type: string
 *     format: date-time
 *   valid_duration:
 *     type: string
 *     description: Duration the discount runs between
 *     example: P3Y6M4DT12H30M5S
 *   regions:
 *     description: The Regions in which the Discount can be used. Available if the relation `regions` is expanded.
 *     type: array
 *     items:
 *       type: object
 *       description: A region object.
 *   usage_limit:
 *     description: "The maximum number of times that a discount can be used."
 *     type: integer
 *     example: 100
 *   usage_count:
 *     description: "The number of times a discount has been used."
 *     type: integer
 *     example: 50
 *     default: 0
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
 *   type:
 *     type: string
 *     enum:
 *        - point
 *        - promo_code
 *        - coupon
 *   store_id:
 *     type: string
 *   owner_store_id:
 *     type: string
 *   title:
 *     type: string
 *   thumbnail:
 *     type: string
 *   store:
 *     $ref: "#/components/schemas/store"
 *   users:
 *     description: Users that used this discount.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/user"
 *   is_sale:
 *     type: boolean
 *     example: false
 *   terms_of_use:
 *     type: string
 *   payback_rate:
 *     type: integer
 *   store_apply:
 *     type: string
 *     enum:
 *        - csv
 *        - all
 *        - store
 *   issuance_timing:
 *     type: string
 *     enum:
 *        - none
 *        - member_register
 *        - follow
 *        - birth_month
 *        - after_ordering
 *        - reviewed
 *        - favorite
 *   amount_limit:
 *     type: integer
 *   is_target_user:
 *     type: boolean
 *     example: false
 *   available_status:
 *     $ref: "#/components/schemas/AvailableStatusEnum"
 *   status:
 *     $ref: "#/components/schemas/DiscountStatus"
 *   display_id:
 *     type: number
 *   released_at:
 *     type: string
 *   store_target_group:
 *     type: string
 */
