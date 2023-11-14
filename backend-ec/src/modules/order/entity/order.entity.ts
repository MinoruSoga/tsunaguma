import { Order as MedusaOrder } from '@medusajs/medusa'
import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { Customer } from '../../user/entity/customer.entity'

export enum OrderCancelStatus {
  PENDING = 'cancel_request',
  CANCEL = 'cancel_completed',
}

export enum OrderCancelType {
  BUYER = 'buyer',
  SELLER = 'seller',
}

@MedusaEntity({ override: MedusaOrder })
@Entity()
export class Order extends MedusaOrder {
  @Index()
  @Column({ nullable: true })
  store_id: string

  @Index()
  @Column({ nullable: false })
  parent_id: string

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'store_id' })
  store: Store

  @ManyToOne(() => Order, (order) => order.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Order

  @OneToMany(() => Order, (order) => order.parent)
  @JoinColumn({ name: 'id', referencedColumnName: 'parent_id' })
  children: Order[]

  @Column({
    type: 'varchar',
    nullable: true,
    enum: OrderCancelStatus,
  })
  cancel_status: string

  @Column({ type: 'varchar', nullable: true })
  cancel_reason: string

  @Column({ type: 'varchar', nullable: true, enum: OrderCancelType })
  cancel_type: string

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  shipped_at: Date

  @ManyToOne(() => Customer, { cascade: ['insert'] })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer

  // more total prices
  addon_subtotal_price = 0
  gift_cover_total = 0
  original_total = 0

  left_subtotal = 0
  coupon_total = 0
  point_used = 0
  promo_code_used: string
  payment_method: string
}

/**
 * @schema order
 * title: "Order"
 * description: "Represents an order"
 * x-resourceId: order
 * required:
 *   - customer_id
 *   - email
 *   - region_id
 *   - currency_code
 * properties:
 *   id:
 *     type: string
 *     description: The order's ID
 *     example: order_01G8TJSYT9M6AVS5N4EMNFS1EK
 *   status:
 *     type: string
 *     description: The order's status
 *     enum:
 *       - pending
 *       - completed
 *       - archived
 *       - canceled
 *       - requires_action
 *     default: pending
 *   fulfillment_status:
 *     type: string
 *     description: The order's fulfillment status
 *     enum:
 *       - not_fulfilled
 *       - partially_fulfilled
 *       - fulfilled
 *       - partially_shipped
 *       - shipped
 *       - partially_returned
 *       - returned
 *       - canceled
 *       - requires_action
 *     default: not_fulfilled
 *   cancel_status:
 *     type: string
 *     description: The order's cancel status
 *     enum:
 *       - cancel_request
 *       - cancel_completed
 *   payment_status:
 *     type: string
 *     description: The order's payment status
 *     enum:
 *       - not_paid
 *       - awaiting
 *       - captured
 *       - partially_refunded
 *       - refuneded
 *       - canceled
 *       - requires_action
 *     default: not_paid
 *   display_id:
 *     type: integer
 *     description: The order's display ID
 *     example: 2
 *   cart_id:
 *     type: string
 *     description: The ID of the cart associated with the order
 *     example: cart_01G8ZH853Y6TFXWPG5EYE81X63
 *   cart:
 *     description: A cart object. Available if the relation `cart` is expanded.
 *     type: object
 *   customer_id:
 *     type: string
 *     description: The ID of the customer associated with the order
 *     example: cus_01G2SG30J8C85S4A5CHM2S1NS2
 *   customer:
 *     description: A customer object. Available if the relation `customer` is expanded.
 *     type: object
 *   email:
 *     description: The email associated with the order
 *     type: string
 *     format: email
 *   billing_address_id:
 *     type: string
 *     description: The ID of the billing address associated with the order
 *     example: addr_01G8ZH853YPY9B94857DY91YGW
 *   billing_address:
 *     description: Available if the relation `billing_address` is expanded.
 *     $ref: "#/components/schemas/address"
 *   shipping_address_id:
 *     type: string
 *     description: The ID of the shipping address associated with the order
 *     example: addr_01G8ZH853YPY9B94857DY91YGW
 *   shipping_address:
 *     description: Available if the relation `shipping_address` is expanded.
 *     $ref: "#/components/schemas/address"
 *   region_id:
 *     type: string
 *     description: The region's ID
 *     example: reg_01G1G5V26T9H8Y0M4JNE3YGA4G
 *   region:
 *     description: A region object. Available if the relation `region` is expanded.
 *     type: object
 *   currency_code:
 *     description: "The 3 character currency code that is used in the order"
 *     type: string
 *     example: usd
 *     externalDocs:
 *       url: https://en.wikipedia.org/wiki/ISO_4217#Active_codes
 *       description: See a list of codes.
 *   currency:
 *     description: Available if the relation `currency` is expanded.
 *     $ref: "#/components/schemas/currency"
 *   tax_rate:
 *     description: The order's tax rate
 *     type: number
 *     example: 0
 *   discounts:
 *     type: array
 *     description: The discounts used in the order. Available if the relation `discounts` is expanded.
 *     items:
 *       type: object
 *       description: A discount object.
 *   gift_cards:
 *     type: array
 *     description: The gift cards used in the order. Available if the relation `gift_cards` is expanded.
 *     items:
 *       type: object
 *       description: A gift card object.
 *   shipping_methods:
 *     type: array
 *     description: The shipping methods used in the order. Available if the relation `shipping_methods` is expanded.
 *     items:
 *       $ref: "#/components/schemas/shipping_method"
 *   payments:
 *     type: array
 *     description: The payments used in the order. Available if the relation `payments` is expanded.
 *     items:
 *       $ref: "#/components/schemas/payment"
 *   fulfillments:
 *     type: array
 *     description: The fulfillments used in the order. Available if the relation `fulfillments` is expanded.
 *     items:
 *       $ref: "#/components/schemas/fulfillment"
 *   returns:
 *     type: array
 *     description: The returns associated with the order. Available if the relation `returns` is expanded.
 *     items:
 *       type: object
 *       description: A return object.
 *   claims:
 *     type: array
 *     description: The claims associated with the order. Available if the relation `claims` is expanded.
 *     items:
 *       type: object
 *       description: A claim order object.
 *   refunds:
 *     type: array
 *     description: The refunds associated with the order. Available if the relation `refunds` is expanded.
 *     items:
 *       type: object
 *       description: A refund object.
 *   swaps:
 *     type: array
 *     description: The swaps associated with the order. Available if the relation `swaps` is expanded.
 *     items:
 *       type: object
 *       description: A swap object.
 *   draft_order_id:
 *     type: string
 *     description: The ID of the draft order this order is associated with.
 *     example: null
 *   draft_order:
 *     description: A draft order object. Available if the relation `draft_order` is expanded.
 *     type: object
 *   items:
 *     type: array
 *     description: The line items that belong to the order. Available if the relation `items` is expanded.
 *     items:
 *       $ref: "#/components/schemas/line_item"
 *   edits:
 *     type: array
 *     description: "[EXPERIMENTAL] Order edits done on the order. Available if the relation `edits` is expanded."
 *     items:
 *       $ref: "#/components/schemas/order_edit"
 *   gift_card_transactions:
 *     type: array
 *     description: The gift card transactions used in the order. Available if the relation `gift_card_transactions` is expanded.
 *     items:
 *       $ref: "#/components/schemas/gift_card_transaction"
 *   canceled_at:
 *     type: string
 *     description: The date the order was canceled on.
 *     format: date-time
 *   cancel_type:
 *     type: string
 *     description: The order's cancel type
 *     enum:
 *       - buyer
 *       - seller
 *   cancel_reason:
 *     type: string
 *   no_notification:
 *     description: "Flag for describing whether or not notifications related to this should be send."
 *     type: boolean
 *     example: false
 *   idempotency_key:
 *     type: string
 *     description: Randomly generated key used to continue the processing of the order in case of failure.
 *     externalDocs:
 *       url: https://docs.medusajs.com/advanced/backend/payment/overview#idempotency-key
 *       description: Learn more how to use the idempotency key.
 *   external_id:
 *     description: The ID of an external order.
 *     type: string
 *     example: null
 *   sales_channel_id:
 *     type: string
 *     description: The ID of the sales channel this order is associated with.
 *     example: null
 *   sales_channel:
 *     description: A sales channel object. Available if the relation `sales_channel` is expanded.
 *     type: object
 *   shipping_total:
 *     type: integer
 *     description: The total of shipping
 *     example: 1000
 *   discount_total:
 *     type: integer
 *     description: The total of discount
 *     example: 800
 *   tax_total:
 *     type: integer
 *     description: The total of tax
 *     example: 0
 *   refunded_total:
 *     type: integer
 *     description: The total amount refunded if the order is returned.
 *     example: 0
 *   total:
 *     type: integer
 *     description: The total amount of the order
 *     example: 8200
 *   subtotal:
 *     type: integer
 *     description: The subtotal of the order
 *     example: 8000
 *   paid_total:
 *     type: integer
 *     description: The total amount paid
 *     example: 8000
 *   refundable_amount:
 *     type: integer
 *     description: The amount that can be refunded
 *     example: 8200
 *   gift_card_total:
 *     type: integer
 *     description: The total of gift cards
 *     example: 0
 *   gift_card_tax_total:
 *     type: integer
 *     description: The total of gift cards with taxes
 *     example: 0
 *   gift_cover_total:
 *     type: integer
 *     description: The total of gift cover
 *     example: 0
 *   addon_subtotal_price:
 *     type: integer
 *     description: The total of addon
 *     example: 0
 *   original_total:
 *     type: integer
 *   store:
 *     type: object
 *     description: store for order
 *     $ref: "#/components/schemas/store"
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
 *   shipped_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   coupon_total:
 *     type: number
 *   point_used:
 *     type: number
 *   promo_code_used:
 *     type: string
 */
