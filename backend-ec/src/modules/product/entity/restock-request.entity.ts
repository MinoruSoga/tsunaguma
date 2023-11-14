import { BaseEntity, ProductVariant } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { Product } from './product.entity'

@MedusaEntity()
@Entity()
export class RestockRequest extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  product_id: string

  @ManyToOne(() => Product, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @Column({ type: 'varchar', nullable: false })
  variant_id: string

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'variant_id', referencedColumnName: 'id' })
  variant: ProductVariant

  @Column({ type: 'varchar', nullable: false })
  user_id: string

  @Column({ type: 'varchar', nullable: true })
  content: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'restock_rq')
    }
  }
}

/**
 * @schema restock_request
 * title: "Restock Request"
 * description: "Restock request."
 * x-resourceId: restock_request
 * required:
 *   - product_id
 *   - variant_id
 *   - user_id
 * properties:
 *  id:
 *    type: string
 *    description: ID of the restock request
 *    example: restock_rq_01G8ZC9VS1XVE149MGH2J7QSSH
 *  product_id:
 *     type: string
 *     description: The product's ID
 *     example: product_01G749BFYR6T8JTVW6SGW3K3E6
 *  product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *  user_id:
 *     type: string
 *     description: The User's ID
 *     example: user_01G749BFYR6T8JTVW6SGW3K3E6
 *  content:
 *     type: string
 *     description: Restock request note
 *  user:
 *     description: Available if the relation `user_id` is expanded.
 *     $ref: "#/components/schemas/user"
 *  variant_id:
 *     type: string
 *     description: The product variant's ID
 *     example: prod_variant_01G749BFYR6T8JTVW6SGW3K3E6
 *  variant:
 *     description: Available if the relation `variant_id` is expanded.
 *     $ref: "#/components/schemas/product_variant"
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
