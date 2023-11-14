import { BaseEntity } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { ProductType } from './product-type.entity'

@MedusaEntity()
@Entity()
export class ProductSize extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  product_type_id: string | null

  @ManyToOne(() => ProductType, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_type_id', referencedColumnName: 'id' })
  product_type: ProductType

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false })
  unit: string

  @Column({ type: 'varchar', nullable: true })
  desc: string | null

  @Column({ type: 'boolean', default: false })
  is_free: boolean

  @Column({ type: 'int', nullable: false })
  rank: number

  @Column({ type: 'boolean', default: false })
  is_selectable: boolean

  @Column({ nullable: true, type: 'varchar' })
  image: string
}

/**
 * @schema product_size
 * title: "Size"
 * description: "A product size."
 * x-resourceId: product_size
 * required:
 *   - name
 *   - unit
 * properties:
 *   id:
 *    type: string
 *    description: ID of the size
 *    example: color_01G8ZC9VS1XVE149MGH2J7QSSH
 *   product_type_id:
 *     type: string
 *     description: "The product_type that the size belongs to."
 *     example: ptyp_01G8ZH853YPY9B94857DY91YGW
 *   product_type:
 *     description: Available if the relation `product_type_id` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   name:
 *    type: string
 *    description: Name of the size
 *    example: S
 *   desc:
 *    type: string
 *    description: Description of the size
 *    example: Abc
 *   unit:
 *    type: string
 *    description: Unit of the size
 *    example: cm
 *   is_free:
 *    type: boolean
 *    description: can input free-word
 *    example: true
 *   rank:
 *    type: number
 *    description: the display order
 *    example: 1
 *   is_selectable:
 *    type: boolean
 *    description: can selectable when input size
 *    example: false
 *   image:
 *     type: string
 *     description: The image of product size
 *   created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *   updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
