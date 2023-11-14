import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { ShippingOption } from '../../shipping/entities/shipping-option.entity'
import { Product } from './product.entity'

@MedusaEntity()
@Entity()
export class ProductShippingOptions {
  @PrimaryColumn({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, (product) => product.product_shipping_options)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @PrimaryColumn({ type: 'varchar', nullable: false })
  shipping_option_id: string

  @ManyToOne(() => ShippingOption)
  @JoinColumn({ name: 'shipping_option_id', referencedColumnName: 'id' })
  shipping_option: ShippingOption

  @Column({ nullable: false, type: 'integer', default: 0  })
  bulk_added_price: number

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date

  @Column({ nullable: false, type: 'integer', default: 0 })
  rank: number
}

/**
 * @schema product_shipping_options
 * title: "Product Shipping Options"
 * description: "Available shipping options when buy a product."
 * x-resourceId: product_shipping_options
 * required:
 *   - product_id
 *   - shipping_option_id
 * properties:
 *   product_id:
 *     type: string
 *     description: The product's ID
 *     example: product_01G749BFYR6T8JTVW6SGW3K3E6
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   shipping_option_id:
 *     type: string
 *     description: The shipping option
 *     example: ship_opts_01G749BFYR6T8JTVW6SGW3K3E6
 *   shipping_option:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/shipping_option"
 *   bulk_added_price:
 *     type: number
 *     description: added price when bulk buying
 *   created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *   updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 *   rank:
 *    type: number
 */
