import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsArray, IsInt, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../user/constant'
import { DiscountSearchService } from '../../services/discount-search.service'

/**
 * @oas [post] /discounts/search
 * operationId: "SearchDiscount"
 * summary: "Search discount"
 * description: "Search discount"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/SearchDiscountBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  count:
 *                    type: integer
 *                  discounts:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/discount"
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
 *
 */
const searchDiscountsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const discountSearchService: DiscountSearchService = req.scope.resolve(
    'discountSearchService',
  )

  const validated = await validator(SearchDiscountBody, req.body)

  const [discounts, count] = await discountSearchService.search(validated)

  res.json({ discounts, count })
}

export default searchDiscountsController

/**
 * @schema SearchDiscountBody
 * title: "search discounts body"
 * description: "search discounts body"
 * x-resourceId: SearchDiscountBody
 * properties:
 *  code:
 *    type: string
 *  type:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["coupon", "promo_code"]
 *  id:
 *    type: number
 *  conditions:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["fixed", "percentage", "free_shipping"]
 *  amount_from:
 *    type: number
 *  amount_to:
 *    type: number
 *  usage_from:
 *    type: number
 *  usage_to:
 *    type: number
 *  available:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["yes", "no"]
 *  publisher:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["store", "admin"]
 *  starts_at:
 *    type: string
 *  ends_at:
 *    type: string
 *  released_from:
 *    type: string
 *  released_to:
 *    type: string
 *  usage_limit:
 *    type: number
 *  store_apply:
 *    type: string
 *    example: "all"
 *  store_id:
 *    type: number
 *  store_name:
 *    type: string
 *  company_name:
 *    type: string
 *  furigana:
 *    type: string
 *  type_id:
 *    type: string
 *  limit:
 *    type: number
 *    default: 10
 *  offset:
 *    type: number
 *  product_id:
 *    type: number
 *  product_code:
 *    type: string
 *  product_name:
 *    type: string
 */

export class SearchDiscountBody {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: 10

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsOptional()
  @IsArray()
  type?: string[]

  @IsNumber()
  @IsOptional()
  id: number

  @IsString()
  @IsOptional()
  code?: string

  @IsArray()
  @IsOptional()
  conditions?: string[]

  @IsOptional()
  @IsNumber()
  amount_from: number

  @IsOptional()
  @IsNumber()
  amount_to: number

  @IsOptional()
  @IsArray()
  available?: string[]

  @IsOptional()
  @IsArray()
  publisher: string[]

  @IsString()
  @IsOptional()
  starts_at: string

  @IsString()
  @IsOptional()
  ends_at: string

  @IsString()
  @IsOptional()
  released_from: string

  @IsString()
  @IsOptional()
  released_to: string

  @IsNumber()
  @IsOptional()
  usage_from: number

  @IsNumber()
  @IsOptional()
  usage_to: number

  @IsString()
  @IsOptional()
  store_apply: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  store_id: number

  @IsString()
  @IsOptional()
  store_name: string

  @IsString()
  @IsOptional()
  company_name: string

  @IsString()
  @IsOptional()
  furigana: string

  @IsString()
  @IsOptional()
  type_id: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  product_id: number

  @IsString()
  @IsOptional()
  product_code: string

  @IsString()
  @IsOptional()
  product_name: string
}
