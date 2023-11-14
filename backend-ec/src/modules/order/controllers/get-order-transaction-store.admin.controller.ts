import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { OrderStatusEnum } from '../../cart/controllers/get-items-store.admin.controller'
import { OrderService } from '../services/order.service'

/**
 * @oas [get] /list-transaction-store
 * operationId: GetListTransactionByStore
 * summary: Get list transaction by store
 * parameters:
 *   - (query) fields {string} (Comma separated) Which fields should be included in each items of the result.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of items
 *   - (query) order {string} The order of items
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each items of the result.
 *   - in: query
 *     name: status
 *     required: false
 *     schema:
 *       $ref: "#/components/schemas/OrderStatusEnum"
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
const getListTransactionStore = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const orderService: OrderService = req.scope.resolve('orderService')

  const [orders, count] = await orderService.listTransactionStore(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ orders, count })
}
export default getListTransactionStore

export class GetListTransactionStoreParams {
  @IsEnum(OrderStatusEnum, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      OrderStatusEnum,
    ).join(', ')})`,
  })
  @IsOptional()
  status?: OrderStatusEnum

  @IsString()
  @IsOptional()
  fields?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  expand?: string

  @IsOptional()
  month?: string

  @IsOptional()
  year?: string
}
