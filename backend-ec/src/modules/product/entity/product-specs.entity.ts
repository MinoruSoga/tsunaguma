import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { Product } from './product.entity'
import { ProductSpec } from './product-spec.entity'

@MedusaEntity()
@Entity()
export class ProductSpecs {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, (product) => product.product_specs)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @Column({ type: 'varchar', nullable: false })
  lv1_id: string

  @Column({ type: 'varchar' })
  lv2_id: string

  @Column({ type: 'varchar' })
  lv3_id: string

  @ManyToOne(() => ProductSpec)
  @JoinColumn({ name: 'lv1_id', referencedColumnName: 'id' })
  lv1: ProductSpec

  @ManyToOne(() => ProductSpec)
  @JoinColumn({ name: 'lv2_id', referencedColumnName: 'id' })
  lv2: ProductSpec

  @ManyToOne(() => ProductSpec)
  @JoinColumn({ name: 'lv3_id', referencedColumnName: 'id' })
  lv3: ProductSpec

  @Column({ type: 'text', nullable: true })
  lv2_content: string | null

  @Column({ type: 'text', nullable: true })
  lv3_content: string | null

  @Column({ nullable: false, type: 'integer' })
  rank: number
}

/**
 * @schema product_specs
 * title: "Product Specifications"
 * description: "Specifications of a product."
 * x-resourceId: product_specs
 * required:
 *   - rank
 * properties:
 *   id:
 *     type: number
 *     description: The country's ID
 *     example: 109
 *   product_id:
 *     type: string
 *     description: The product's ID
 *     example: product_01G749BFYR6T8JTVW6SGW3K3E6
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   lv1_id:
 *     type: string
 *     description: The specs level1's ID
 *     example: specs_01G749BFYR6T8JTVW6SGW3K3E6
 *   lv1:
 *     description: Available if the relation `lv1_id` is expanded.
 *     $ref: "#/components/schemas/product_spec"
 *   lv2_id:
 *     type: string
 *     description: The specs level2's ID
 *     example: specs_01G749BFYR6T8JTVW6SGW3K3E6
 *   lv2:
 *     description: Available if the relation `lv2_id` is expanded.
 *     $ref: "#/components/schemas/product_spec"
 *   lv3_id:
 *     type: string
 *     description: The specs level3's ID
 *     example: specs_01G749BFYR6T8JTVW6SGW3K3E6
 *   lv3:
 *     description: Available if the relation `lv3_id` is expanded.
 *     $ref: "#/components/schemas/product_spec"
 *   rank:
 *     type: number
 *     description: The image's rank
 *     example: 1
 *   lv2_content:
 *     type: string
 *     description: The content of leve1 specs
 *     example: abc
 *   lv3_content:
 *     type: string
 *     description: The content of leve3 specs
 *     example: abc
 */
