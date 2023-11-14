import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { ProductType } from './product-type.entity'

@MedusaEntity()
@Entity()
export class ProductSpec extends BaseEntity {
  @Column({ nullable: true, type: 'varchar' })
  product_type_id: string

  @ManyToOne(() => ProductType, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_type_id', referencedColumnName: 'id' })
  product_type: ProductType

  @Column({ type: 'boolean', default: false })
  is_free: boolean

  @Column({ type: 'varchar', nullable: true })
  parent_id: string

  @Column({ type: 'varchar', nullable: true })
  name: string

  @ManyToOne(() => ProductSpec, (specs) => specs.children)
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: ProductSpec

  @OneToMany(() => ProductSpec, (specs) => specs.parent)
  children: ProductSpec[]

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'specs')
  }
}

/**
 * @schema product_spec
 * title: "Product Specification"
 * description: "Product Specification."
 * x-resourceId: product_spec
 * required:
 *   - product_type_id
 * properties:
 *   id:
 *    type: string
 *    description: ID of the specs
 *    example: specs_01G8ZC9VS1XVE149MGH2J7QSSH
 *   product_type_id:
 *     type: string
 *     description: "The product_type that the specs belongs to."
 *     example: ptyp_01G8ZH853YPY9B94857DY91YGW
 *   product_type:
 *     description: Available if the relation `product_type_id` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   parent_id:
 *     type: string
 *     description: "The parent that the specs belongs to."
 *     example: specs_01G8ZH853YPY9B94857DY91YGW
 *   parent:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/product_spec"
 *   children:
 *     description: The children of this specs. Available if the relation `children` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_spec"
 *   is_free:
 *    type: boolean
 *    example: cm
 *   name:
 *    type: string
 *    description: Name of the spec
 *    example: Spec_name
 *   created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *   updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 *   deleted_at:
 *    type: string
 *    description: "The date with timezone at which the resource was deleted."
 *    format: date-time
 */
