import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

import { Product } from './product.entity'
import { ProductColor } from './product-color.entity'

@MedusaEntity()
@Entity()
export class ProductColors {
  @PrimaryColumn({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, (product) => product.product_colors)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @PrimaryColumn({ type: 'varchar' })
  color_id: string

  @ManyToOne(() => ProductColor)
  @JoinColumn({ name: 'color_id', referencedColumnName: 'id' })
  color: ProductColor

  @Column({ nullable: false, type: 'integer' })
  rank: number
}

/**
 * @schema product_colors
 * title: "Product Colors"
 * description: "Colors of a product."
 * x-resourceId: product_colors
 * required:
 *   - product_id
 *   - color_id
 *   - rank
 * properties:
 *   product_id:
 *     type: string
 *     description: The product's ID
 *     example: product_01G749BFYR6T8JTVW6SGW3K3E6
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   color_id:
 *     type: string
 *     description: The color's ID
 *     example: pro_color_01G749BFYR6T8JTVW6SGW3K3E6
 *   color:
 *     description: Available if the relation `color_id` is expanded.
 *     $ref: "#/components/schemas/product_color"
 *   rank:
 *     type: number
 *     description: The product color's rank
 */
