import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'

import { Image } from './image.entity'
import { Product } from './product.entity'

@MedusaEntity()
@Entity()
export class ProductImages {
  @PrimaryColumn({ type: 'varchar' })
  product_id: string

  @ManyToOne(() => Product, (product) => product.product_images, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @PrimaryColumn({ type: 'varchar' })
  image_id: string

  @ManyToOne(() => Image, (image) => image.product_images, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'image_id', referencedColumnName: 'id' })
  image: Image

  @Column({ nullable: false, type: 'integer' })
  rank: number

  @BeforeInsert()
  private insertDefaultRank(): void {
    if (!this.rank) {
      this.rank = 1
    }
  }
}

/**
 * @schema product_image
 * title: "Product Image"
 * description: "Product Images can be added to Products for filtering and reporting purposes."
 * x-resourceId: product_image
 * required:
 *   - product_id
 *   - image_id
 *   - rank
 * properties:
 *   product_id:
 *     type: string
 *     description: The product's ID
 *   image_id:
 *     description: "The Image's ID"
 *     type: string
 *   rank:
 *     type: number
 *     description: The product image's rank
 *   product:
 *     $ref: "#/components/schemas/product"
 *     description: "The product that attacted to"
 *   image:
 *     description: Image detail
 *     $ref: "#/components/schemas/image"
 */
