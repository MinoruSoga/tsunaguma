import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

import { ProductAddon } from '../../store/entity/product-addon.entity'
import { LineItem } from './line-item.entity'

@MedusaEntity()
@Entity()
export class LineItemAddons {
  @PrimaryColumn({ type: 'varchar' })
  line_item_id: string

  @PrimaryColumn({ type: 'varchar' })
  lv1_id: string

  @PrimaryColumn({ type: 'varchar' })
  lv2_id: string

  @ManyToOne(() => ProductAddon)
  @JoinColumn({ name: 'lv1_id' })
  lv1: ProductAddon

  @ManyToOne(() => ProductAddon)
  @JoinColumn({ name: 'lv2_id' })
  lv2: ProductAddon

  @Column({ nullable: true, type: 'integer' })
  price: number

  @ManyToOne(() => LineItem, (lineItem) => lineItem.line_item_addons)
  @JoinColumn({ name: 'line_item_id', referencedColumnName: 'id' })
  line_item: LineItem
}

/**
 * @schema line_item_addons
 * title: "LineItemAddons"
 * description: "Addons of a lineitem."
 * x-resourceId: line_item_addons
 * required:
 *   - line_item_id
 *   - lv1_id
 *   - lv2_id
 * properties:
 *   line_item_id:
 *     type: string
 *     description: The line item's ID
 *   line_item:
 *     description: Available if the relation `line_item_id` is expanded.
 *     $ref: "#/components/schemas/line_item"
 *   lv1_id:
 *     type: string
 *     description: The addon lv1's ID
 *   lv1:
 *     description: Available if the relation `lv1_id` is expanded.
 *     $ref: "#/components/schemas/product_addon"
 *   lv2_id:
 *     type: string
 *     description: The addon lv2's ID
 *   lv2:
 *     description: Available if the relation `lv2_id` is expanded.
 *     $ref: "#/components/schemas/product_addon"
 *   price:
 *     type: number
 *     description: The price of product addon
 */
