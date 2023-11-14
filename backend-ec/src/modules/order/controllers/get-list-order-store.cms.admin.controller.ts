import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OrderStatusEnum } from '../../cart/controllers/get-items-store.admin.controller'
import { OrderService } from '../services/order.service'

/**
 * @oas [get] /list-order-store/{id}
 * operationId: GetListOrderByStoreCms
 * summary: Get list order by store cms
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store.
 *   - (query) search {string}  The conditions for search in list order.
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
const getListOrderStoreCms = async (
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

  const [orders, count] = await orderService.listOrdersStoreCms(
    id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ orders, count })
}
export default getListOrderStoreCms

export class GetListOrderStoreCmsParams {
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

  @IsString()
  @IsOptional()
  search?: string

  @IsOptional()
  month?: string

  @IsOptional()
  year?: string
}
