import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { Product } from '../../product/entity/product.entity'
import { User } from '../../user/entity/user.entity'

@MedusaEntity()
@Entity()
export class ProductFavorite {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  user_id: string

  @Column({ nullable: false })
  product_id: string

  @Column({ nullable: true })
  tmp_user_id: string

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date

  @BeforeInsert()
  private beforeInsertId() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'fprod')
    }
  }
}

/**
 * @schema ProductFavorite
 * title: "Product Favorite"
 * description: "Product Favorite"
 * x-resourceId: ProductFavorite
 * properties:
 *   id:
 *     description: "The id of the favorite"
 *     type: string
 *     example: product_product_1
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     example: usr_1
 *   product_id:
 *     description: "The id of the product"
 *     type: string
 *     example: prod_1
 *   tmp_user_id:
 *     description: "Uuid"
 *     type: string
 *     example: 112231
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
