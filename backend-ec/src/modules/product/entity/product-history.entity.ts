import { BaseEntity } from '@medusajs/medusa'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { generateEntityId } from '@medusajs/medusa/dist/utils/generate-entity-id'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { Product } from './product.entity'

@MedusaEntity()
@Entity()
export class ProductHistory extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  product_id: string

  @ManyToOne(() => Product, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product?: Product

  @Column({ type: 'varchar', nullable: false })
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: User

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: object

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'prod_his')
  }
}

/**
 * @schema product_history
 * title: "Product History"
 * description: "History of a product."
 * x-resourceId: product_history
 * required:
 *   - product_id
 *   - user_id
 * properties:
 *  id:
 *    type: string
 *    description: ID of the reaction
 *    example: prod_reaction_01G8ZC9VS1XVE149MGH2J7QSSH
 *  product_id:
 *     type: string
 *     description: The product's ID
 *     example: product_01G749BFYR6T8JTVW6SGW3K3E6
 *  product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *  user_id:
 *     type: string
 *     description: The user's ID
 *     example: user_01G749BFYR6T8JTVW6SGW3K3E6
 *  user:
 *     description: Available if the relation `user` is expanded.
 *     $ref: "#/components/schemas/user"
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 */
