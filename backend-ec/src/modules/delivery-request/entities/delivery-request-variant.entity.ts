import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { Product } from '../../product/entity/product.entity'
import { ProductVariant } from '../../product/entity/product-variant.entity'
import { DeliveryRequest } from './delivery-request.entity'

@MedusaEntity()
@Entity()
export class DeliveryRequestVariant {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  variant_id: string

  @ManyToOne(() => Product, (v) => v.id, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id', referencedColumnName: 'id' })
  variant: ProductVariant

  @PrimaryColumn({ type: 'varchar', nullable: false })
  delivery_request_id: string

  @ManyToOne(() => DeliveryRequest, (d) => d.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_request_id', referencedColumnName: 'id' })
  delivery_request: DeliveryRequest

  @Column({ type: 'integer', default: 0 })
  @Check('delivery_quantity >= 0')
  delivery_quantity: number

  @Column({ type: 'boolean', nullable: true })
  different_quantity_flag: boolean

  @Column({ type: 'integer', nullable: true })
  different_quantity: number

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date
}

/**
 * @schema delivery_request_variant
 * title: "DeliveryRequestVariant"
 * description: "DeliveryRequestVariant."
 * x-resourceId: delivery_request_variant
 * required:
 *   - variant_id
 *   - delivery_request_id
 *   - delivery_quantity
 * properties:
 *   variant_id:
 *     description: The Id of product
 *     type: string
 *   delivery_request_id:
 *     type: string
 *   delivery_quantity:
 *     type: number
 *   different_quantity_flag:
 *     type: boolean
 *   different_quantity:
 *     type: number
 *   variant:
 *     description: Available if the relation `variant_id` is expanded.
 *     $ref: "#/components/schemas/product_variant"
 *   delivery_request:
 *     $ref: "#/components/schemas/delivery_request"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
