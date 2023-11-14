import { Return as MedusaReturn } from '@medusajs/medusa'
import { resolveDbGenerationStrategy } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { Order } from '../../order/entity/order.entity'

/**
 * @schema OriginEnum
 * title: "OriginEnum"
 * description: "Origin enum"
 * x-resourceId: OriginEnum
 * type: string
 * enum:
 *   - requested
 *   - prm_delivery
 *   - administration
 */

export enum OriginEnum {
  REQUESTED = 'requested',
  PRM_DELIVERY = 'prm_delivery',
  ADMINISTRATION = 'administration',
}

export enum ReturnStatus {
  REQUESTED = 'requested',
  RECEIVED = 'received',
  REQUIRES_ACTION = 'requires_action',
  CANCELED = 'canceled',
  DELETED = 'deleted',
  PAUSE = 'pause',
}

@MedusaEntity({ override: MedusaReturn })
@Entity()
export class Return extends MedusaReturn {
  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @ManyToOne(() => Order, (o) => o.returns)
  @JoinColumn({ name: 'order_id' })
  order: Order
  data: any

  @Column({ type: 'boolean', default: false })
  is_pause: boolean

  @Column({ type: 'varchar', nullable: true })
  reason: string

  @Column({
    type: 'enum',
    enum: OriginEnum,
    default: OriginEnum.REQUESTED,
  })
  origin: OriginEnum
}

/**
 * @schema return
 * title: "Return"
 * description: "Return orders hold information about Line Items that a Customer wishes to send back, along with how the items will be returned. Returns can be used as part of a Swap."
 * x-resourceId: return
 * required:
 *   - refund_amount
 * properties:
 *   id:
 *     type: string
 *     description: The return's ID
 *     example: ret_01F0YET7XPCMF8RZ0Y151NZV2V
 *   status:
 *     description: "Status of the Return."
 *     type: string
 *     enum:
 *       - requested
 *       - received
 *       - requires_action
 *       - canceled
 *       - deleted
 *     default: requested
 *   items:
 *     description: The Return Items that will be shipped back to the warehouse. Available if the relation `items` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/return_item"
 *   swap_id:
 *     description: "The ID of the Swap that the Return is a part of."
 *     type: string
 *     example: null
 *   swap:
 *     description: A swap object. Available if the relation `swap` is expanded.
 *     type: object
 *   order_id:
 *     description: "The ID of the Order that the Return is made from."
 *     type: string
 *     example: order_01G8TJSYT9M6AVS5N4EMNFS1EK
 *   order:
 *     description: An order object. Available if the relation `order` is expanded.
 *     type: object
 *   claim_order_id:
 *     description: "The ID of the Claim that the Return is a part of."
 *     type: string
 *     example: null
 *   claim_order:
 *     description: A claim order object. Available if the relation `claim_order` is expanded.
 *     type: object
 *   shipping_method:
 *     description: The Shipping Method that will be used to send the Return back. Can be null if the Customer facilitates the return shipment themselves. Available if the relation `shipping_method` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/shipping_method"
 *   shipping_data:
 *     description: "Data about the return shipment as provided by the Fulfilment Provider that handles the return shipment."
 *     type: object
 *     example: {}
 *   refund_amount:
 *     description: "The amount that should be refunded as a result of the return."
 *     type: integer
 *     example: 1000
 *   no_notification:
 *     description: "When set to true, no notification will be sent related to this return."
 *     type: boolean
 *     example: false
 *   idempotency_key:
 *     type: string
 *     description: Randomly generated key used to continue the completion of the return in case of failure.
 *     externalDocs:
 *       url: https://docs.medusajs.com/advanced/backend/payment/overview#idempotency-key
 *       description: Learn more how to use the idempotency key.
 *   received_at:
 *     description: "The date with timezone at which the return was received."
 *     type: string
 *     format: date-time
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
 *   display_id:
 *     type: number
 *   is_pause:
 *     type: boolean
 *   reason:
 *     type: string
 *   origin:
 *     $ref: "#/components/schemas/OriginEnum"
 */
