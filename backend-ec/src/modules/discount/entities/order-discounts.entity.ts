import { Entity as MedusaEntity } from 'medusa-extender'
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

import { Order } from '../../order/entity/order.entity'
import { Discount } from './discount.entity'

@MedusaEntity()
@Entity()
export class OrderDiscounts {
  @PrimaryColumn()
  order_id: string

  @PrimaryColumn()
  discount_id: string

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: Order

  @ManyToOne(() => Discount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discount_id' })
  discount?: Discount
}

/**
 * @schema order_discounts
 * title: "Order discounts"
 * description: "Order discounts"
 * x-resourceId: order_discounts
 * required:
 *   - order_id
 *   - discount_id
 * properties:
 *   order_id:
 *     description: "The ID of the Order"
 *     type: string
 *   discount_id:
 *     description: "The ID of the Discount"
 *     type: string
 *   order:
 *     $ref: "#/components/schemas/order"
 *   discount:
 *     $ref: "#/components/schemas/discount"
 */
