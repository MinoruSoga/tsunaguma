import { Image as MedusaImage } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { ProductImages } from './product-images.entity'

@MedusaEntity({ override: MedusaImage })
@Entity()
export class Image extends MedusaImage {
  @Column({ type: 'varchar', nullable: true })
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @OneToMany(() => ProductImages, (productImage) => productImage.image)
  product_images: ProductImages
}

/**
 * @schema image
 * title: "Image"
 * description: "Images holds a reference to a URL at which the image file can be found."
 * x-resourceId: image
 * required:
 *   - url
 *   - store_id
 * properties:
 *   id:
 *     type: string
 *     description: The image's ID
 *     example: img_01G749BFYR6T8JTVW6SGW3K3E6
 *   url:
 *     description: "The URL at which the image file can be found."
 *     type: string
 *     format: uri
 *   store_id:
 *     type: string
 *     description: "The Store that the image belongs to."
 *     example: store_01G8ZH853YPY9B94857DY91YGW
 *   store:
 *     description: Available if the relation `store_id` is expanded.
 *     $ref: "#/components/schemas/store"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   deleted_at:
 *     type: string
 *     description: "The date with timezone at which the resource was deleted."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 */
