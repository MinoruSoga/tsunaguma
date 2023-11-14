import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { OrderService } from '../services/order.service'

/**
 * @oas [get] /payment/{id}/history
 * operationId: GetPaymentHistoryOfOrder
 * summary: Get payment history of order
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Order.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of items
 *   - (query) order {string} The order of items
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             histories:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/payment"
 *             count:
 *               type: integer
 *               description: The total number of items available
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
const getPaymentHistoryOrder = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const orderService: OrderService = req.scope.resolve('orderService')
  const { id } = req.params
  const [histories, count] = await orderService.paymentHistory(
    id,
    req.listConfig,
  )

  res.status(200).json({ histories, count })
}
export default getPaymentHistoryOrder

export class GetPaymentHistoryOrderParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number
}

export const defaultPaymentHistoryFields = [
  'provider_id',
  'amount',
  'created_at',
]
