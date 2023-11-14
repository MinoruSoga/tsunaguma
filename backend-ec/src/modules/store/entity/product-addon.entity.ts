import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender/dist/decorators/components.decorator'
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { Store } from './store.entity'

@MedusaEntity()
@Entity()
export class ProductAddon extends BaseEntity {
  @Column({ nullable: false })
  name: string

  @Column({ type: 'int' })
  price: number

  @Column({ nullable: true })
  parent_id: string

  @Column({ nullable: true })
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @ManyToOne(() => ProductAddon, (productAddon) => productAddon.children, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: ProductAddon

  @OneToMany(() => ProductAddon, (productAddon) => productAddon.parent)
  children: ProductAddon[]

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null

  @Column({ nullable: false, type: 'integer' })
  rank: number

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'prod_addon')
  }
}

/**
 * @schema product_addon
 * title: "Product Addon"
 * description: "Holds settings optional addons for store, etc."
 * x-resourceId: product_addon
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The product_addon's ID
 *     example: stadd_01G1G5V21KADXNGH29BJMAJ4B4
 *   name:
 *     description: "The name of the Addon - this may be displayed to the Customer."
 *     type: string
 *     example: Gift wrapping service
 *   price:
 *     description: Addons price service.
 *     type: integer
 *     example: 100
 *   parent_id:
 *     description: The ID of the StoreAddon as parent.
 *     type: string
 *     example: stadd_01G1G5V21KADXNGH29BJMAJ4B4
 *   parent:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/product_addon"
 *   children:
 *     description: The children of this addon. Available if the relation `children` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_addon"
 *   store_id:
 *     type: string
 *     description: The of the store that has addon.
 *     example: null
 *   store:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/store"
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   rank:
 *     type: number
 */
