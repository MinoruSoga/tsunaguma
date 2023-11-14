import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { ProductType } from './product-type.entity'

@MedusaEntity()
@Entity()
export class ProductMaterial extends BaseEntity {
  @Column({ nullable: false, type: 'varchar' })
  name: string

  @Column({ type: 'text', nullable: true })
  product_type_id: string | null

  @ManyToOne(() => ProductType, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_type_id', referencedColumnName: 'id' })
  product_type: ProductType

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'prod_material')
  }
}

/**
 * @schema product_material
 * title: "Material"
 * description: "Material of product related to a product type."
 * x-resourceId: product_material
 * required:
 *   - name
 * properties:
 *   id:
 *     type: string
 *     description: The image's ID
 *     example: img_01G749BFYR6T8JTVW6SGW3K3E6
 *   name:
 *     description: "The name of material"
 *     type: string
 *   product_type_id:
 *     type: string
 *     description: "The product_type that the material belongs to."
 *     example: ptyp_01G8ZH853YPY9B94857DY91YGW
 *   product_type:
 *     description: Available if the relation `product_type_id` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
