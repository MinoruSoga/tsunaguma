import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { OrderService } from '../services/order.service'

/**
 * @oas [get] /list-order-billing
 * operationId: GetListOrderBilling
 * summary: Get list order by billing
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of items
 *   - (query) order {string} The order of items
 *   - in: query
 *     name: month
 *     schema:
 *       type: string
 *     description: filter by month
 *   - in: query
 *     name: year
 *     schema:
 *       type: string
 *     description: filter by year
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/order"
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
const getListOrderBilling = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const orderService: OrderService = req.scope.resolve('orderService')
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const [orders, count] = await orderService.getBillingForOrder(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ orders, count })
}
export default getListOrderBilling

export class GetListOrderBillingParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsOptional()
  month?: string

  @IsOptional()
  year?: string
}
