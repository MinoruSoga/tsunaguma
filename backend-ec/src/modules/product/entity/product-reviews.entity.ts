import { BaseEntity, ProductVariant } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm'

import { LineItem } from '../../cart/entity/line-item.entity'
import { Order } from '../../order/entity/order.entity'
import { User } from '../../user/entity/user.entity'
import { Product } from './product.entity'

@MedusaEntity()
@Entity()
export class ProductReviews extends BaseEntity {
  // id of product which is reviewed
  @Column({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, (product) => product.product_reviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  // id of variant which is reviewed
  @Column({ type: 'varchar' })
  variant_id: string

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'variant_id', referencedColumnName: 'id' })
  variant: ProductVariant

  // id of order which is review
  @Column({ type: 'varchar' })
  order_id: string

  @ManyToOne(() => Order, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  order: Order

  // id of user who writes the review
  // customer_id or store owner id (in case store reply review of customer)
  @Column({ type: 'varchar' })
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @Column({ type: 'varchar' })
  line_item_id: string

  @ManyToOne(() => LineItem, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'line_item_id', referencedColumnName: 'id' })
  line_item: LineItem

  @Column({ type: 'int2', nullable: true })
  rate: number | null

  @Column({ type: 'int2', nullable: true })
  reply_cnt: number | null

  @Column({ type: 'text', nullable: true })
  content: string | null

  // id of review which is replied
  @Column({ type: 'varchar', nullable: true })
  parent_id: string

  @Column({ type: 'text', nullable: true })
  reply_content: string | null

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  reply_at: Date

  @ManyToOne(() => ProductReviews, (review) => review.children, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: ProductReviews

  @OneToMany(() => ProductReviews, (review) => review.parent)
  children: ProductReviews[]

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'prod_review')

    if (!this.rate) {
      this.rate = 0
    }
  }
}

/**
 * @schema product_reviews
 * title: "Product Reviews"
 * description: "Reviews of a product."
 * x-resourceId: product_reviews
 * required:
 *   - product_id
 *   - variant_id
 *   - user_id
 *   - order_id
 * properties:
 *  id:
 *    type: string
 *    description: ID of the review
 *    example: prod_review_01G8ZC9VS1XVE149MGH2J7QSSH
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
 *  user:
 *     description: Available if the relation `user_id` is expanded.
 *     $ref: "#/components/schemas/user"
 *  line_item_id:
 *     type: string
 *     description: The Line Item's ID
 *  line_item:
 *     description: Available if the relation `line_item_id` is expanded.
 *     $ref: "#/components/schemas/line_item"
 *  order:
 *     type: string
 *     description: The order's ID
 *     example: order_01G749BFYR6T8JTVW6SGW3K3E6
 *  order_id:
 *     type: string
 *  variant_id:
 *     type: string
 *     description: The product variant's ID
 *     example: prod_variant_01G749BFYR6T8JTVW6SGW3K3E6
 *  variant:
 *     description: Available if the relation `variant_id` is expanded.
 *     $ref: "#/components/schemas/product_variant"
 *  parent_id:
 *     type: string
 *     description: "The parent that the product review belongs to."
 *     example: review_01G8ZH853YPY9B94857DY91YGW
 *  parent:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/product_reviews"
 *  children:
 *     description: The children of this product review. Available if the relation `children` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_reviews"
 *  reply_cnt:
 *     type: number
 *     description: The product review's reply count
 *  rate:
 *     type: number
 *     description: The product review's rate
 *  content:
 *     type: string
 *     description: The product review's content
 *  reply_content:
 *     type: string
 *     description: The product review's reply content
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 *  reply_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
