import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import {
  DbAwareColumn,
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  AfterLoad,
  BeforeInsert,
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { Product } from '../../product/entity/product.entity'
import { Store } from '../../store/entity/store.entity'

/**
 * @schema DeliveryRequestStatus
 * title: "DeliveryRequestStatus"
 * description: "The list of status of the delivery request"
 * x-resourceId: DeliveryRequestStatus
 * type: string
 * enum:
 *   - draft
 *   - delivered
 *   - pending
 *   - cancelled
 *   - deleted
 */

export enum DeliveryRequestStatus {
  DRAFT = 'draft',
  DELIVERED = 'delivered',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  DELETED = 'deleted',
}

/**
 * @schema DeliveryRequestAdminStatus
 * title: "DeliveryRequestAdminStatus"
 * description: "The list of status of admin delivery request"
 * x-resourceId: DeliveryRequestAdminStatus
 * type: string
 * enum:
 *   - draft
 *   - new_request
 *   - quantity_confirm
 *   - admin_confirm
 *   - arrived
 *   - main_product_register
 *   - published
 *   - stop_product
 *   - cancelled
 *   - deleted
 */

export enum DeliveryRequestAdminStatus {
  DRAFT = 'draft',
  NEW_REQUEST = 'new_request',
  QUANTITY_CONFIRM = 'quantity_confirm',
  ADMIN_CONFIRM = 'admin_confirm',
  ARRIVED = 'arrived',
  MAIN_PRODUCT_REGISTER = 'main_product_register',
  PUBLISHED = 'published',
  STOP_PRODUCT = 'stop_product',
  CANCELLED = 'cancelled',
  DELETED = 'deleted',
}

@MedusaEntity()
@Entity()
export class DeliveryRequest extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  product_id: string

  @ManyToOne(() => Product, (product) => product.id, { nullable: true })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @Index()
  @Column({ type: 'varchar', nullable: false })
  store_id: string

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ type: 'integer', nullable: true })
  @Check('suggested_price >= 0')
  suggested_price: number

  @Column({
    type: 'enum',
    enum: DeliveryRequestStatus,
    default: DeliveryRequestStatus.DRAFT,
  })
  status: DeliveryRequestStatus

  @Column({
    type: 'enum',
    enum: DeliveryRequestAdminStatus,
    default: DeliveryRequestAdminStatus.DRAFT,
  })
  admin_status: DeliveryRequestAdminStatus

  // background
  // 0: simple
  // 1: natural
  // 2: luxury
  // 3: classic
  @Column({
    type: 'smallint',
    default: 0,
  })
  background_type: number

  // shooting accessories
  @Column({ type: 'smallint', default: 1, nullable: false })
  shooting: number

  @Column({ type: 'varchar', nullable: true })
  parent_id: string

  @ManyToOne(() => DeliveryRequest, (p) => p.id)
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: DeliveryRequest

  @OneToMany(() => DeliveryRequest, (d) => d.parent)
  children: DeliveryRequest[]

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @Column({ type: 'integer', default: 0 })
  total_stock: number

  @DeleteDateColumn({ type: resolveDbType('timestamptz') })
  deleted_at: Date | null

  @Column({ nullable: true, type: resolveDbType('timestamptz') })
  canceled_at: Date

  @Column({ nullable: true, type: resolveDbType('timestamptz') })
  delivered_at: Date

  @Column({ nullable: true, type: resolveDbType('timestamptz') })
  released_at: Date

  @Column({ type: 'boolean', nullable: false })
  redelivery_flag: boolean

  display_code?: string

  @Column({ type: 'bigint', nullable: false })
  rank: number

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'dev_req')
    }
  }

  @AfterLoad()
  updateDisplayid() {
    if (this.display_id) {
      this.display_code = this.display_id.toString().padStart(10, '0')
    }
  }
}
/**
 * @schema delivery_request
 * title: "DeliveryRequest"
 * description: "Delivery app order request."
 * x-resourceId: delivery_request
 * required:
 *   - product_id
 *   - store_id
 *   - suggested_price
 *   - status
 * properties:
 *   id:
 *     type: string
 *     example: dev_req_01G749BFYR6T8JTVW6SGW3K3E6
 *   product_id:
 *     description: The Id of product
 *     type: string
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   store_id:
 *     type: string
 *     description: The store id of product
 *     example: str_01G8ZH853YPY9B94857DY91YGW
 *   store:
 *     description: Available if the relation `store_id` is expanded.
 *     $ref: "#/components/schemas/store"
 *   suggested_price:
 *     type: number
 *   status:
 *     $ref: "#/components/schemas/DeliveryRequestStatus"
 *   admin_status:
 *     $ref: "#/components/schemas/DeliveryRequestAdminStatus"
 *   background_type:
 *     type: number
 *   shooting:
 *     type: number
 *   parent_id:
 *     type: string
 *   parent:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/delivery_request"
 *   children:
 *     description: The children of this request. Available if the relation `children` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/delivery_request"
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
 *   display_id:
 *     type: string
 *     description: "Auto generated display id"
 *   display_code:
 *     type: string
 *   metadata:
 *     type: object
 *     description: "Metadata of delivery request"
 *   total_stock:
 *     type: number
 *     description: "Total stock of delivery request"
 *   canceled_at:
 *     type: string
 *     description: The date the delivery request was canceled on.
 *     format: date-time
 *   delivered_at:
 *     type: string
 *     description: The date the delivery request was delivered.
 *     format: date-time
 *   released_at:
 *     type: string
 *     description: The date the delivery request was released.
 *     format: date-time
 *   redelivery_flag:
 *     type: boolean
 *   rank:
 *     type: number
 */
