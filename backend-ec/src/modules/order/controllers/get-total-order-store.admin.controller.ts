import { IsNotEmpty, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { OrderService } from '../services/order.service'

/**
 * @oas [get] /total-order-store
 * operationId: GetTotalOrderByStore
 * summary: Get total order by store
 * parameters:
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
 *             result:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: total
 *                 subtotal:
 *                   type: integer
 *                   description: subtotal
 *                 shipping_total:
 *                   type: integer
 *                   description: total shipping
 *                 discount_total:
 *                   type: integer
 *                   description: total discount
 *                 tax_total:
 *                   type: integer
 *                   description: total tax
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
const getListOrderStore = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const orderService: OrderService = req.scope.resolve('orderService')

  const result = await orderService.totalOrdersStore(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ result })
}
export default getListOrderStore

export class GetTotalOrderStoreParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsNotEmpty()
  month?: string

  @IsNotEmpty()
  year?: string
}
