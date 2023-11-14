import { ProductType as MedusaProductType } from '@medusajs/medusa/dist'
import { resolveDbGenerationStrategy } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

@MedusaEntity({ override: MedusaProductType })
@Entity()
export class ProductType extends MedusaProductType {
  @Column({ type: 'varchar', nullable: true })
  parent_id: string

  @ManyToOne(() => ProductType, (productType) => productType.children, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: ProductType

  @OneToMany(() => ProductType, (productType) => productType.parent)
  children: ProductType[]

  @Column({ nullable: false, type: 'integer' })
  rank: number

  @Column({ nullable: true, type: 'varchar' })
  thumbnail: string

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @BeforeInsert()
  private insertDefaultRank(): void {
    if (!this.rank) {
      this.rank = 1
    }
  }
}

/**
 * @schema product_type
 * title: "Product Type"
 * description: "Product Type can be added to Products for filtering and reporting purposes."
 * x-resourceId: product_type
 * required:
 *   - value
 * properties:
 *   id:
 *     type: string
 *     description: The product type's ID
 *     example: ptyp_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   value:
 *     description: "The value that the Product Type represents."
 *     type: string
 *     example: Clothing
 *   rank:
 *     type: number
 *     description: The product color's rank
 *   thumbnail:
 *     type: string
 *     description: The thumbnail of product type
 *   parent_id:
 *     type: string
 *     description: "The parent that the product type belongs to."
 *     example: ptyp_01G8ZH853YPY9B94857DY91YGW
 *   parent:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   children:
 *     description: The children of this product type. Available if the relation `children` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_type"
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
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 */
