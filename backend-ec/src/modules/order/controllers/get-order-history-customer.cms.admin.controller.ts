import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OrderService } from '../services/order.service'

/**
 * @oas [get] /order-history-customer/{id}
 * operationId: GetOrderHistoryByCustomer
 * summary: Get order hsitory by customer
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Customer.
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
const getOrderHistoryCustomer = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const orderService: OrderService = req.scope.resolve('orderService')
  const { id } = req.params
  const [orders, count] = await orderService.ordersHistoryCustomer(
    id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ orders, count })
}
export default getOrderHistoryCustomer

export class GetOrderhistoryCustomerParams {
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

export const defaultOrderDetailFields = [
  'id',
  'display_id',
  'created_at',
  'shipped_at',
]
