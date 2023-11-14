import {
  LineItem as MedusaLineItem,
  ShippingMethod,
} from '@medusajs/medusa/dist'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  // BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { LineItemAddons } from './line-item-addons.entity'

@MedusaEntity({ override: MedusaLineItem })
@Entity()
export class LineItem extends MedusaLineItem {
  @Column({ nullable: true })
  store_id: string

  @ManyToOne(() => Store, { eager: true })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ nullable: false, default: 0 })
  addon_subtotal_price: number

  total_unit_price = 0

  @Column({ nullable: false, default: 0 })
  gift_cover_total: number

  @Column({ nullable: false, default: 0 })
  shipping_total: number

  original_shipping_total = 0

  bulk_shipping_total = 0

  @Column({ nullable: true })
  shipping_method_id: string

  @ManyToOne(() => ShippingMethod)
  @JoinColumn({ name: 'shipping_method_id', referencedColumnName: 'id' })
  shipping_method: ShippingMethod

  @OneToMany(() => LineItemAddons, (addon) => addon.line_item)
  line_item_addons: LineItemAddons[]

  @BeforeInsert()
  beforeInsertDefaultVals() {
    if (!this.id) this.id = generateEntityId(this.id, 'item')
  }
}
/**
 * @schema line_item
 * title: "Line Item"
 * description: "Line Items represent purchasable units that can be added to a Cart for checkout. When Line Items are purchased they will get copied to the resulting order and can eventually be referenced in Fulfillments and Returns. Line Items may also be created when processing Swaps and Claims."
 * x-resourceId: line_item
 * required:
 *   - title
 *   - unit_price
 *   - quantity
 *   - id
 * properties:
 *   id:
 *     type: string
 *     description: The cart's ID
 *     example: item_01G8ZC9GWT6B2GP5FSXRXNFNGN
 *   cart_id:
 *     description: "The ID of the Cart that the Line Item belongs to."
 *     type: string
 *     example: cart_01G8ZH853Y6TFXWPG5EYE81X63
 *   cart:
 *     description: A cart object. Available if the relation `cart` is expanded.
 *     type: object
 *   store_id:
 *     description: "The ID of the Store that the Line Item belongs to."
 *     type: string
 *     example: product_01G8ZH853Y6TFXWPG5EYE81X63
 *   store:
 *     description: A store object. Available if the relation `store` is expanded.
 *     type: object
 *   order_id:
 *     description: "The ID of the Order that the Line Item belongs to."
 *     type: string
 *     example: order_01G8TJSYT9M6AVS5N4EMNFS1EK
 *   order:
 *     description: An order object. Available if the relation `order` is expanded.
 *     type: object
 *   swap_id:
 *     description: "The id of the Swap that the Line Item belongs to."
 *     type: string
 *     example: null
 *   swap:
 *     description: A swap object. Available if the relation `swap` is expanded.
 *     type: object
 *   claim_order_id:
 *     description: "The id of the Claim that the Line Item belongs to."
 *     type: string
 *     example: null
 *   claim_order:
 *     description: A claim order object. Available if the relation `claim_order` is expanded.
 *     type: object
 *   tax_lines:
 *     description: Available if the relation `tax_lines` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/line_item_tax_line"
 *   adjustments:
 *     description: Available if the relation `adjustments` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/line_item_adjustment"
 *   title:
 *     description: "The title of the Line Item, this should be easily identifiable by the Customer."
 *     type: string
 *     example: Medusa Coffee Mug
 *   description:
 *     description: "A more detailed description of the contents of the Line Item."
 *     type: string
 *     example: One Size
 *   thumbnail:
 *     description: "A URL string to a small image of the contents of the Line Item."
 *     type: string
 *     format: uri
 *     example: https://medusa-public-images.s3.eu-west-1.amazonaws.com/coffee-mug.png
 *   is_return:
 *     description: "Is the item being returned"
 *     type: boolean
 *     example: false
 *   is_giftcard:
 *     description: "Flag to indicate if the Line Item is a Gift Card."
 *     type: boolean
 *     example: false
 *   should_merge:
 *     description: "Flag to indicate if new Line Items with the same variant should be merged or added as an additional Line Item."
 *     type: boolean
 *     example: false
 *   allow_discounts:
 *     description: "Flag to indicate if the Line Item should be included when doing discount calculations."
 *     type: boolean
 *     example: false
 *   has_shipping:
 *     description: "Flag to indicate if the Line Item has fulfillment associated with it."
 *     type: boolean
 *     example: false
 *   unit_price:
 *     description: "The price of one unit of the content in the Line Item. This should be in the currency defined by the Cart/Order/Swap/Claim that the Line Item belongs to."
 *     type: number
 *     example: 8000
 *   variant_id:
 *     description: "The id of the Product Variant contained in the Line Item."
 *     type: string
 *     example: variant_01G1G5V2MRX2V3PVSR2WXYPFB6
 *   variant:
 *     description: A product variant object. The Product Variant contained in the Line Item. Available if the relation `variant` is expanded.
 *     type: object
 *   quantity:
 *     description: "The quantity of the content in the Line Item."
 *     type: integer
 *     example: 1
 *   fulfilled_quantity:
 *     description: "The quantity of the Line Item that has been fulfilled."
 *     type: integer
 *     example: 0
 *   returned_quantity:
 *     description: "The quantity of the Line Item that has been returned."
 *     type: integer
 *     example: 0
 *   shipped_quantity:
 *     description: "The quantity of the Line Item that has been shipped."
 *     type: integer
 *     example: 0
 *   refundable:
 *     description: "The amount that can be refunded from the given Line Item. Takes taxes and discounts into consideration."
 *     type: integer
 *     example: 0
 *   subtotal:
 *     type: integer
 *     description: The subtotal of the line item
 *     example: 8000
 *   tax_total:
 *     type: integer
 *     description: The total of tax of the line item
 *     example: 0
 *   total:
 *     type: integer
 *     description: The total amount of the line item
 *     example: 8000
 *   shipping_total:
 *     type: integer
 *     example: 8000
 *   original_total:
 *     type: integer
 *     description: The original total amount of the line item
 *     example: 8000
 *   original_tax_total:
 *     type: integer
 *     description: The original tax total amount of the line item
 *     example: 0
 *   discount_total:
 *     type: integer
 *     description: The total of discount of the line item
 *     example: 0
 *   gift_card_total:
 *     type: integer
 *     description: The total of the gift card of the line item
 *     example: 0
 *   includes_tax:
 *     description: "[EXPERIMENTAL] Indicates if the line item unit_price include tax"
 *     type: number
 *   original_item_id:
 *     description: "[EXPERIMENTAL] The id of the original line item"
 *     type: string
 *   order_edit_id:
 *     description: "[EXPERIMENTAL] The ID of the order edit to which a cloned item belongs"
 *     type: string
 *   order_edit:
 *     description: "[EXPERIMENTAL] The order edit joined"
 *     type: object
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   addon_subtotal_price:
 *     type: integer
 *     description: Price of the addons
 *     example: 0
 *   total_unit_price:
 *     type: integer
 *     description: unit_price + addon_subtotal_price
 *     example: 0
 *   gift_cover_total:
 *     type: integer
 *     description: Price of the gift cover
 *     example: 0
 *   original_shipping_total:
 *     type: integer
 *     description: Price of the shipping (not bulk)
 *     example: 0
 *   bulk_shipping_total:
 *     type: integer
 *     description: Price of the gift cover (Bulk shipping price)
 *     example: 0
 *   shipping_method_id:
 *     type: string
 *   shipping_method:
 *     description: A shipping method object. The Shipping Method contained in the Line Item. Available if the relation `shipping_method_id` is expanded.
 *     type: object
 *   line_item_addons:
 *     description: A line item addons object. The Line Item Addons contained in the Line Item. Available if the relation line_item is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/line_item_addons"
 */
