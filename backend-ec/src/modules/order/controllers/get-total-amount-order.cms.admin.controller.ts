import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { OrderService } from '../services/order.service'

/**
 * @oas [get] /order-total-amount/{id}
 * operationId: GetTotalOrderByCustomer
 * summary: Get total order by customer
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Customer.
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             total_amount:
 *               type: integer
 *               description: total
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
const getTotalAmountOrder = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const orderService: OrderService = req.scope.resolve('orderService')
  const { id } = req.params

  const result = await orderService.getTotalAmountOrder(id)

  res.status(200).json(...result)
}
export default getTotalAmountOrder
