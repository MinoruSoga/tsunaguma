/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  defaultStoreOrdersFields,
  defaultStoreOrdersRelations,
} from '@medusajs/medusa'

import UserService from '../../user/services/user.service'
import { OrderService } from '../services/order.service'

/**
 * @oas [get] /orders/{id}
 * operationId: "GetOrdersOrder"
 * summary: "Get an Order"
 * description: "Retrieves an Order"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Order.
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       // must be previously logged in or use api token
 *       medusa.admin.orders.retrieve(order_id)
 *       .then(({ order }) => {
 *         console.log(order.id);
 *       });
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl --location --request GET 'https://medusa-url.com/admin/orders/{id}' \
 *       --header 'Authorization: Bearer {api_token}'
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
export default async (req, res) => {
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
