import { Store as MedusaStore } from '@medusajs/medusa/dist'
import {
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  AfterLoad,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm'

import { StoreGroup } from '../../discount/entities/store-group.entity'
import { Order } from '../../order/entity/order.entity'
import { Product } from '../../product/entity/product.entity'
import { Role } from '../../role/role.entity'
import { Customer } from '../../user/entity/customer.entity'
import { User } from '../../user/entity/user.entity'
import { PaybackSetting } from './payback-setting.entity'
import { StoreBilling } from './store_billing.entity'
import { StoreDetail } from './store-detail.entity'

export enum StorePlanType {
  STANDARD = 'standard',
  PRIME = 'prime',
}
/**
 * @schema StorePlanTypeEnum
 * title: "StorePlanTypeEnum"
 * description: "The list of plan of the User"
 * x-resourceId: StorePlanTypeEnum
 * type: string
 * enum:
 *   - standard
 *   - prime
 */

export enum StoreBusinessForm {
  INDIVIDUAL = 'personal',
  CORPORATION = 'company',
}
/**
 * @schema StoreBusinessFormEnum
 * title: "StoreBusinessFormEnum"
 * description: "The list of business form of the User"
 * x-resourceId: StoreBusinessFormEnum
 * type: string
 * enum:
 *   - personal
 *   - company
 */

export enum StoreStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BANNED = 'banned',
  STOPPED = 'stopped',
}
/**
 * @schema StoreStatusEnum
 * title: "StoreStatusEnum"
 * description: "The list of status of the User"
 * x-resourceId: StoreStatusEnum
 * type: string
 * enum:
 *   - pending
 *   - approved
 *   - rejected
 *   - banned
 *   - stopped
 */

export enum StorePhotoServiceEnum {
  BASIC = 'basic',
  CUSTOMIZED = 'customized',
  LOCKET = 'locket',
}

/**
 * @schema StorePhotoServiceEnum
 * title: "StorePhotoServiceEnum"
 * description: "The list of store photo service"
 * x-resourceId: StorePhotoServiceEnum
 * type: string
 * enum:
 *   - basic
 *   - customized
 *   - locket
 */
@MedusaEntity({ override: MedusaStore })
@Entity()
export class Store extends MedusaStore {
  @OneToMany(() => Product, (product) => product.store)
  @JoinColumn({ name: 'id', referencedColumnName: 'store_id' })
  products: Product[]

  @OneToMany(() => Order, (order) => order.store)
  @JoinColumn({ name: 'id', referencedColumnName: 'store_id' })
  orders: Order[]

  @OneToMany(() => Role, (role) => role.store)
  @JoinColumn({ name: 'id', referencedColumnName: 'store_id' })
  roles: Role[]

  @Column({
    type: 'enum',
    enum: StorePlanType,
  })
  plan_type: StorePlanType

  @Column({ type: 'enum', enum: StoreBusinessForm })
  business_form: StoreBusinessForm

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.PENDING,
  })
  status: StoreStatus

  @Column({
    type: 'enum',
    enum: StoreStatus,
    nullable: true,
  })
  old_status: StoreStatus

  @Column({
    type: 'enum',
    enum: StorePhotoServiceEnum,
    nullable: true,
  })
  photo_service_type: StorePhotoServiceEnum

  @Column({ type: 'varchar', nullable: true })
  payback_setting_id: string

  @Column({
    nullable: true,
    comment: 'null for admin; other for registerd store',
  })
  owner_id: string

  @OneToOne(() => User)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  owner: User

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  customer: Customer

  @JoinTable({
    name: 'store_group_stores',
    inverseJoinColumn: {
      name: 'store_group_id',
      referencedColumnName: 'id',
    },
    joinColumn: {
      name: 'store_id',
      referencedColumnName: 'id',
    },
  })
  @ManyToMany(() => StoreGroup, (sg) => sg.stores, {
    onDelete: 'CASCADE',
  })
  groups: StoreGroup[]

  @Column({
    nullable: true,
  })
  store_detail_id: string

  @Column({ type: 'int', default: 5 })
  margin_rate: number

  @Column({ type: 'int', default: 0 })
  spec_rate: number

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  spec_starts_at: Date | null

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  spec_ends_at: Date | null

  @OneToOne(() => StoreDetail)
  @JoinColumn({ name: 'store_detail_id', referencedColumnName: 'id' })
  store_detail: StoreDetail

  @OneToOne(() => PaybackSetting)
  @JoinColumn({ name: 'payback_setting_id', referencedColumnName: 'id' })
  payback_setting: PaybackSetting

  @Column({ nullable: false, unique: true })
  slug: string

  @Column({ nullable: true })
  avatar: string

  @Column({ nullable: true })
  intro: string

  @Column({ nullable: true })
  about: string

  @Column({ nullable: true })
  url: string // homepage url

  @Column({ nullable: false })
  free_ship_amount: number

  @DeleteDateColumn({ type: resolveDbType('timestamptz') })
  deleted_at: Date | null

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  approved_at: Date | null

  @OneToMany(() => StoreBilling, (bill) => bill.store)
  @JoinColumn({ name: 'id', referencedColumnName: 'store_id' })
  store_billing: StoreBilling[]

  @Column({ type: 'integer', default: 0 })
  follow_cnt: number

  @Column({ type: 'boolean', default: false })
  is_return_guarantee: boolean

  @Column({ type: 'enum', enum: StoreStatus, nullable: true })
  opt_return_status: StoreStatus

  @Column({ type: 'enum', enum: StoreStatus, nullable: true })
  opt_photo_status: StoreStatus

  @Column({ type: 'boolean', default: false })
  has_photo_service: boolean

  @Column({ type: 'varchar', nullable: true })
  photo_service_note: string

  @Column({ type: 'varchar', nullable: true })
  return_guarantee_note: string

  is_followed: boolean
  is_url_updated: boolean
  owner_display_id: number

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ type: 'integer', default: 0 })
  new_transaction_cnt: number

  @Column({ type: 'boolean', default: false })
  init_rank: boolean

  @BeforeInsert()
  private beforeInsertDefaultVals() {
    if (!this.slug) {
      this.slug = this.id
    }
    if (!this.name) {
      this.name = 'つくつな'
    }
    if (!this.plan_type) {
      this.plan_type = StorePlanType.STANDARD
    }
    if (!this.business_form) {
      this.business_form = StoreBusinessForm.CORPORATION
    }
    if (!this.status) {
      this.status = StoreStatus.PENDING
    }
  }

  @AfterLoad()
  loadIsUrlUpdated(): void {
    // a store is considered to already update url if url is not null and url is different from its id
    this.is_url_updated = !!this.url && this.url !== this.id
  }
}

/**
 * @schema store
 * title: "Store"
 * description: "Holds settings for the Store, such as name, currencies, etc."
 * x-resourceId: store
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The store's ID
 *     example: store_01G1G5V21KADXNGH29BJMAJ4B4
 *   name:
 *     description: "The name of the Store - this may be displayed to the Customer."
 *     type: string
 *     example: Medusa Store
 *   owner_id:
 *     description: "ID of store owner"
 *     type: string
 *     example: usr_123
 *   owner:
 *     $ref: "#/components/schemas/user"
 *   customer:
 *     $ref: "#/components/schemas/customer"
 *   store_detail_id:
 *     description: "ID of store detail"
 *     type: string
 *     example: store_detail_123
 *   store_detail:
 *     $ref: "#/components/schemas/store_detail"
 *   slug:
 *     description: "Slug of store"
 *     type: string
 *     example: hello-world
 *   avatar:
 *     description: "avatar of Store"
 *     type: string
 *     example: https://example.com/image.jpg
 *   intro:
 *     description: "introduction of Store"
 *     type: string
 *     example: "introduction"
 *   about:
 *     description: "about of Store"
 *     type: string
 *     example: "about"
 *   url:
 *     type: string
 *   is_url_updated:
 *     type: boolean
 *   free_ship_amount:
 *     description: "free ship amount of Store"
 *     type: number
 *     example: "200"
 *   default_currency_code:
 *     description: "The 3 character currency code that is the default of the store."
 *     type: string
 *     example: usd
 *     externalDocs:
 *       url: https://en.wikipedia.org/wiki/ISO_4217#Active_codes
 *       description: See a list of codes.
 *   default_currency:
 *     description: Available if the relation `default_currency` is expanded.
 *     $ref: "#/components/schemas/currency"
 *   currencies:
 *     description: The currencies that are enabled for the Store. Available if the relation `currencies` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/currency"
 *   swap_link_template:
 *     description: "A template to generate Swap links from. Use {{cart_id}} to include the Swap's `cart_id` in the link."
 *     type: string
 *     example: null
 *   payment_link_template:
 *     description: "A template to generate Payment links from. Use {{cart_id}} to include the payment's `cart_id` in the link."
 *     type: string
 *     example: null
 *   invite_link_template:
 *     description: "A template to generate Invite links from"
 *     type: string
 *     example: null
 *   default_sales_channel_id:
 *     type: string
 *     description: The sales channel ID the cart is associated with.
 *     example: null
 *   default_sales_channel:
 *     description: A sales channel object. Available if the relation `default_sales_channel` is expanded.
 *     type: object
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   status:
 *     $ref: "#/components/schemas/StoreStatusEnum"
 *   photo_service_type:
 *     $ref: "#/components/schemas/StorePhotoServiceEnum"
 *   has_photo_service:
 *     type: boolean
 *   photo_service_note:
 *     type: string
 *   business_form:
 *     $ref: "#/components/schemas/StoreBusinessFormEnum"
 *   plan_type:
 *     $ref: "#/components/schemas/StorePlanTypeEnum"
 *   payback_setting_id:
 *     type: string
 *   payback_setting:
 *     $ref:  "#/components/schemas/payback_setting"
 *   approved_at:
 *     type: string
 *   follow_cnt:
 *     type: number
 *   is_followed:
 *     type: boolean
 *   margin_rate:
 *     description: "Product unit margin rate."
 *     type: number
 *     example: 0
 *   spec_rate:
 *     description: "Product unit special margin rate."
 *     type: number
 *     example: 0
 *   spec_starts_at:
 *     type: string
 *     description: "The Special margin setting period starts."
 *     format: date-time
 *   spec_ends_at:
 *     type: string
 *     description: "The Special margin setting period ends."
 *     format: date-time
 *   owner_display_id:
 *     type: number
 *   display_id:
 *     type: number
 *   is_return_guarantee:
 *     type: boolean
 *   return_guarantee_note:
 *     type: string
 *   opt_return_status:
 *     $ref: "#/components/schemas/StoreStatusEnum"
 *   opt_photo_status:
 *     $ref: "#/components/schemas/StoreStatusEnum"
 *   new_transaction_cnt:
 *     type: number
 *   init_rank:
 *     type: boolean
 */
