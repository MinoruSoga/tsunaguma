import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { OrderService } from '../services/order.service'

/**
 * @oas [put] /order/{id}/fulfillment-status
 * operationId: "ChageOrderFulfillmentStatus"
 * summary: "Chage order fulfillment status"
 * description: "Chage order fulfillment status"
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
const chageOrderFulfillmentStatus = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params
  const orderService: OrderService = req.scope.resolve('orderService')

  await orderService.updateOrderFulfillmentStatus(id)

  res.sendStatus(200)
}

export default chageOrderFulfillmentStatus
