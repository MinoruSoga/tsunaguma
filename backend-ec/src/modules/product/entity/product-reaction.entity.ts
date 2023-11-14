import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { Product } from './product.entity'

/**
 * @schema ProductReactionEnum
 * title: "ProductReactionEnum"
 * description: "Reaction of product"
 * x-resourceId: ProductReactionEnum
 * type: string
 * enum:
 *   - favorite
 *   - like
 */
export enum ProductReactionEnum {
  FAVORITE = 'favorite',
  LIKE = 'like',
}

@MedusaEntity()
@Entity()
export class ProductReaction extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @PrimaryColumn({ type: 'varchar' })
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @PrimaryColumn({ type: 'enum', enum: ProductReactionEnum, nullable: false })
  type: string

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'prod_reaction')
  }
}

/**
 * @schema product_reaction
 * title: "Product Reaction"
 * description: "Reacitons of a product."
 * x-resourceId: product_reaction
 * required:
 *   - product_id
 *   - type
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
 *  type:
 *     $ref: "#/components/schemas/ProductReactionEnum"
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
