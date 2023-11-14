/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  defaultStoreOrdersFields,
  defaultStoreOrdersRelations,
} from '@medusajs/medusa'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import UserService from '../../user/services/user.service'
import { OrderService } from '../services/order.service'

/**
 * @oas [get] /orders/{id}/cms
 * operationId: "GetOrdersOrderCms"
 * summary: "Get an Order Cms"
 * description: "Retrieves an Order Cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Order.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             order:
 *               $ref: "#/components/schemas/order"
 *             user:
 *               $ref: "#/components/schemas/user"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const { id } = req.params

  const orderService: OrderService = req.scope.resolve('orderService')
  const userService: UserService = req.scope.resolve('userService')
  const order = await orderService.retrieveDetail(id, {
    // @ts-ignore
    select: defaultStoreOrdersFields.concat([
      'cancel_status',
      'parent_id',
      'metadata',
      'cancel_reason',
      'refundable_amount',
      'shipped_at',
      'updated_at',
    ]),
    relations: defaultStoreOrdersRelations.concat([
      'store',
      'store.owner',
      'store.store_detail',
      'items.line_item_addons',
      'items.line_item_addons.lv1',
      'items.line_item_addons.lv2',
      'items.shipping_method',
      'billing_address',
      'discounts.parent_discount',
      'returns',
    ]),
  })

  const userId = order.customer_id
  const user = await userService.retrieve(
    userId,
    {
      relations: ['address'],
    },
    false,
  )
  res.json({ order, user })
}
