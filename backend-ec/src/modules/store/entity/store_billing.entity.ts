import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { Store } from './store.entity'

export enum TransferType {
  MANUAL = 'manual',
  AUTO = 'auto',
}

@MedusaEntity()
@Entity()
export class StoreBilling extends BaseEntity {
  @Column({ nullable: false })
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ nullable: true })
  transfer_type: TransferType

  @Column({ nullable: false, default: 0 })
  total_origin_price: number

  @Column({ nullable: false, default: 0 })
  total_delivery_price: number

  @Column({ nullable: false, default: 0 })
  total_discount_coupon: number

  @Column({ nullable: false, default: 0 })
  total_fee: number

  @Column({ nullable: false, default: 0 })
  total_discount_campaign: number

  @Column({ nullable: false, default: 0 })
  total_discount_promotion: number

  @Column({ nullable: false, default: 0 })
  total_coupon_used: number

  @Column({ nullable: false, default: 0 })
  total_price: number

  @Column({ nullable: false, default: 0 })
  tax_price: number

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'store_billing')
  }
}
/**
 * @schema storeBilling
 * title: "Store Billing"
 * description: "List Store billing detail"
 * x-resourceId: storeBilling
 * properties:
 *   id:
 *     description: "The id of the store_billing"
 *     type: string
 *     example: store_billing_1
 *   store_id:
 *     description: "The id of the store"
 *     type: string
 *     example: str_1
 *   transfer_type:
 *     description: "Transfer type"
 *     type: string
 *     enum: [manual, auto]
 *   total_origin_price:
 *     description: "total origin price"
 *     type: integer
 *     example: 100
 *   total_delivery_price:
 *     description: "total delivery price"
 *     type: integer
 *     example: 100
 *   total_discount_coupon:
 *     description: "total discount coupon"
 *     type: integer
 *     example: 100
 *   total_fee:
 *     description: "total fee"
 *     type: integer
 *     example: 100
 *   total_discount_campaign:
 *     description: "total discount campaign"
 *     type: integer
 *     example: 100
 *   total_discount_promotion:
 *     description: "total discount promotion"
 *     type: integer
 *     example: 100
 *   total_coupon_used:
 *     description: "total coupon used"
 *     type: integer
 *     example: 2
 *   total_price:
 *     description: "total price"
 *     type: integer
 *     example: 500
 *   tax_price:
 *     description: "total price"
 *     type: integer
 *     example: 50
 *   store:
 *     $ref: "#/components/schemas/store"
 *   metadata:
 *     $ref: '#/components/schemas/metaDataType'
 *   created_at:
 *     type: string
 *   updated_at:
 *     type: string
 */
