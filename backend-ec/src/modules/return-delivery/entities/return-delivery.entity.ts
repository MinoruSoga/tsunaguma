import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import {
  DbAwareColumn,
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { ProductVariant } from '../../product/entity/product-variant.entity'
import { Store } from '../../store/entity/store.entity'

/**
 * @schema ReturnDeliveryOriginEnum
 * title: "ReturnDeliveryOriginEnum"
 * description: "Return Delivery Origin enum"
 * x-resourceId: ReturnDeliveryOriginEnum
 * type: string
 * enum:
 *   - requested
 *   - prm_delivery
 *   - administration
 */

export enum ReturnDeliveryOriginEnum {
  REQUESTED = 'requested',
  PRM_DELIVERY = 'prm_delivery',
  ADMINISTRATION = 'administration',
}

/**
 * @schema ReturnDeliveryStatus
 * title: "ReturnDeliveryStatus"
 * description: "Return Delivery Status enum"
 * x-resourceId: ReturnDeliveryStatus
 * type: string
 * enum:
 *   - requested
 *   - received
 *   - canceled
 *   - pause
 */
export enum ReturnDeliveryStatus {
  REQUESTED = 'requested',
  SHIPPED = 'received',
  CANCELED = 'canceled',
  PAUSE = 'pause',
}

@MedusaEntity()
@Entity()
export class ReturnDelivery extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', nullable: false })
  store_id: string

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Index()
  @Column({ type: 'varchar', nullable: false })
  variant_id: string

  @ManyToOne(() => ProductVariant, (variant) => variant.id)
  @JoinColumn({ name: 'variant_id', referencedColumnName: 'id' })
  variant: ProductVariant

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ type: 'boolean', default: false })
  is_pause: boolean

  @Column({ type: 'varchar', nullable: true })
  reason: string

  @Column({ type: 'varchar', nullable: true })
  note: string

  @Column({
    type: 'enum',
    enum: ReturnDeliveryOriginEnum,
    default: ReturnDeliveryOriginEnum.REQUESTED,
  })
  origin: ReturnDeliveryOriginEnum

  @Column({
    type: 'enum',
    enum: ReturnDeliveryStatus,
    default: ReturnDeliveryStatus.REQUESTED,
  })
  status: ReturnDeliveryStatus

  @Column({ type: 'int', nullable: false, default: 0 })
  quantity: number

  @Column({ type: 'varchar', nullable: true })
  delivery_slip_no: string

  @Column({ nullable: true, type: resolveDbType('timestamptz') })
  shipped_at: Date

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'ret_deli')
    }
  }
}

/**
 * @schema return_delivery
 * title: "ReturnDelivery"
 * description: "Return delivery"
 * x-resourceId: return_delivery
 * required:
 *   - store_id
 *   - variant_id
 *   - quantity
 * properties:
 *   id:
 *     type: string
 *     description: The return's ID
 *     example: ret_01F0YET7XPCMF8RZ0Y151NZV2V
 *   store_id:
 *     type: string
 *   store:
 *     $ref: "#/components/schemas/store"
 *   variant_id:
 *     type: string
 *   variant:
 *     $ref: "#/components/schemas/product_variant"
 *   status:
 *     $ref: "#/components/schemas/ReturnDeliveryStatus"
 *   quantity:
 *     type: number
 *   shipped_at:
 *     description: "The date with timezone at which the return was shipped."
 *     type: string
 *     format: date-time
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
 *   display_id:
 *     type: number
 *   is_pause:
 *     type: boolean
 *   reason:
 *     type: string
 *   delivery_slip_no:
 *     type: string
 *   note:
 *     type: string
 *   origin:
 *     $ref: "#/components/schemas/ReturnDeliveryOriginEnum"
 */
