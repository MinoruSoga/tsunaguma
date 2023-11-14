import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OrderSearchService } from '../services/order-search.service'

/**
 * @oas [post] /list-order-cms
 * operationId: GetListOrderForCms
 * summary: Get list order for admin cms
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetListOrderCmsBody"
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
const getListOrderCms = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const orderSearchService: OrderSearchService =
    req.scope.resolve('orderSearchService')
  const validated = await validator(GetListOrderCmsBody, req.body)

  const [orders, count] = await orderSearchService.searchOrderCms(validated)

  res.status(200).json({ orders, count })
}
export default getListOrderCms

/**
 * @schema GetListOrderCmsBody
 * title: "Get Lis Order  cms body"
 * description: "Get List Order  cms body"
 * x-resourceId: GetListOrderCmsBody
 * properties:
 *  created_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  created_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  completed_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  completed_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  shipped_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  shipped_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  canceled_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  canceled_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  updated_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  updated_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  display_id_from:
 *    type: number
 *  display_id_to:
 *    type: number
 *  store_name:
 *    type: string
 *  store_id:
 *    type: number
 *  customer_type:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *  customer_id:
 *    type: number
 *  nickname:
 *    type: string
 *  phone:
 *    type: string
 *  email:
 *    type: string
 *  customer_name:
 *    type: string
 *  customer_name_furi:
 *    type: string
 *  display_id:
 *    type: number
 *  product_name:
 *    type: string
 *  product_id:
 *    type: number
 *  product_code:
 *    type: string
 *  amount_from:
 *    type: number
 *  amount_to:
 *    type: number
 *  payment_method:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *  promo_code:
 *    type: string
 *  plan_type:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *  status:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *  shipping_address:
 *    type: string
 *  ship_from:
 *    type: string
 *  coupon_id:
 *    type: number
 *  delivery_slip_num:
 *    type: number
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 */

export class GetListOrderCmsBody {
  @IsString()
  @IsOptional()
  created_from: string

  @IsString()
  @IsOptional()
  created_to: string

  @IsString()
  @IsOptional()
  completed_from: string

  @IsString()
  @IsOptional()
  completed_to: string

  @IsString()
  @IsOptional()
  shipped_from: string

  @IsString()
  @IsOptional()
  shipped_to: string

  @IsString()
  @IsOptional()
  canceled_from: string

  @IsString()
  @IsOptional()
  canceled_to: string

  @IsString()
  @IsOptional()
  updated_from: string

  @IsString()
  @IsOptional()
  updated_to: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  display_id_from: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  display_id_to: number

  @IsString()
  @IsOptional()
  store_name: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  store_id: string

  @IsArray()
  @IsOptional()
  customer_type: string[]

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  customer_id: number

  @IsString()
  @IsOptional()
  nickname: string

  @IsString()
  @IsOptional()
  phone: string

  @IsString()
  @IsOptional()
  email: string

  @IsString()
  @IsOptional()
  customer_name: string

  @IsString()
  @IsOptional()
  customer_name_furi: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  display_id: number

  @IsString()
  @IsOptional()
  product_name: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  product_id: number

  @IsString()
  @IsOptional()
  product_code: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount_from: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount_to: number

  @IsArray()
  @IsOptional()
  payment_method: string[]

  @IsString()
  @IsOptional()
  promo_code: string

  @IsArray()
  @IsOptional()
  plan_type: string[]

  @IsArray()
  @IsOptional()
  status: string[]

  @IsString()
  @IsOptional()
  shipping_address: string

  @IsString()
  @IsOptional()
  ship_from: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  delivery_slip_num: number

  @IsOptional()
  @IsNumber()
  coupon_id: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number
}
