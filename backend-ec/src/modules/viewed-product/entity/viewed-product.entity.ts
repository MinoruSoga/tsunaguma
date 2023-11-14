import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { Product } from '../../product/entity/product.entity'
import { User } from '../../user/entity/user.entity'

@MedusaEntity()
@Entity()
export class ViewedProduct extends BaseEntity {
  @Column({ nullable: true })
  user_id: string

  @Column()
  product_id: string

  @Column()
  tmp_user_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @BeforeInsert()
  private beforeInsertId() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'vprod')
    }
  }
}

/**
 * @schema ViewedProduct
 * title: "Viewed Product"
 * description: "Viewed Product"
 * x-resourceId: ViewedProduct
 * required:
 *    - id
 *    - tmp_user_id
 *    - product_id
 *    - product
 * properties:
 *   id:
 *     description: "The id of the viewed product"
 *     type: string
 *     example: vprod_01GK6HJ9SX0VE59ZZATQCXACT2
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     example: usr_01GK6HJ9SX0VE59ZZATQCXACT2
 *   product_id:
 *     description: "The id of the product"
 *     type: string
 *     example: prod_01GK6HJ9SX0VE59ZZATQCXACT2
 *   tmp_user_id:
 *     description: "Uuid"
 *     type: string
 *     example: tusr_01GK6HJ9SX0VE59ZZATQCXACT2
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 */
