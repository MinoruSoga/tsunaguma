import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { Product } from '../product/entity/product.entity'
import { Store } from '../store/entity/store.entity'
import { User } from '../user/entity/user.entity'

@MedusaEntity()
@Entity()
export class Complain extends BaseEntity {
  @Index()
  @Column({ type: 'string', nullable: false })
  user_id: string

  @Index()
  @Column({ type: 'string', nullable: false })
  product_id: string

  @Index()
  @Column({ type: 'string', nullable: false })
  store_id: string

  @Column({ nullable: false })
  reason: string

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn({ name: 'store_id' })
  store: Store

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'complain')
  }
}
/**
 * @schema complain
 * title: "complain"
 * description: "complain"
 * x-resourceId: complain
 * properties:
 *   id:
 *     description: "The id of the complain"
 *     type: string
 *     example: complain_1
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     nullable: false
 *     example: usr_1
 *   product_id:
 *     type: string
 *     nullable: false
 *     description: "The id of the product"
 *   store_id:
 *     type: string
 *     nullable: false
 *     description: "The id of the product"
 *   reason:
 *     type: string
 *     nullable: false
 *     description: "reason of complain"
 *   created_at:
 *     type: string
 *   updated_at:
 *     type: string
 */
