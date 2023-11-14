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

import { ProductAddon } from '.././../store/entity/product-addon.entity'
import { Product } from './product.entity'

@MedusaEntity()
@Entity()
export class ProductAddons {
  @PrimaryColumn({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, (product) => product.product_addons)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @PrimaryColumn({ type: 'varchar', nullable: false })
  lv1_id: string

  @ManyToOne(() => ProductAddon)
  @JoinColumn({ name: 'lv1_id', referencedColumnName: 'id' })
  lv1: ProductAddon

  @PrimaryColumn({ type: 'varchar', nullable: false })
  lv2_id: string

  @ManyToOne(() => ProductAddon)
  @JoinColumn({ name: 'lv2_id', referencedColumnName: 'id' })
  lv2: ProductAddon

  @Column({ nullable: false, type: 'integer' })
  rank: number

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date
}

/**
 * @schema product_addons
 * title: "Product Addons"
 * description: "Available addons when buy a product."
 * x-resourceId: product_addons
 * required:
 *   - product_id
 * properties:
 *   product_id:
 *     type: string
 *     description: The product's ID
 *     example: product_01G749BFYR6T8JTVW6SGW3K3E6
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   lv1_id:
 *     type: string
 *     description: The product addon level 1's ID
 *     example: prod_addon_01G749BFYR6T8JTVW6SGW3K3E6
 *   lv1:
 *     description: Available if the relation `lv1_id` is expanded.
 *     $ref: "#/components/schemas/product_addon"
 *   lv2_id:
 *     type: string
 *     description: The product addon level 2's ID
 *     example: prod_addon_01G749BFYR6T8JTVW6SGW3K3E6
 *   lv2:
 *     description: Available if the relation `lv2_id` is expanded.
 *     $ref: "#/components/schemas/product_addon"
 *   rank:
 *     type: number
 *     description: The product addon's rank
 *   created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *   updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
