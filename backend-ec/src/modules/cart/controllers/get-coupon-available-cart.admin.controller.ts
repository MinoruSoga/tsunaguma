import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { DiscountType } from '../../discount/entities/discount.entity'
import { CartService } from '../services/cart.service'

/**
 * @oas [get] /discounts/{id}/coupon
 * operationId: "GetCouponsAvailableForCart"
 * summary: "list Coupons Available for Cart."
 * description: "Retrieve a list Coupons Available for Cart."
 * x-authenticated: true
 * parameters:
 *   - (path) id=*{string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) fields {string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) limit {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each product of the result.
 *   - in: query
 *     name: type
 *     required: false
 *     schema:
 *       $ref: "#/components/schemas/DiscountTypeEnum"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             discounts:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/discount"
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

const listCouponAvailable = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const id = req.params.id
  const cartService: CartService = req.scope.resolve('cartService')

  const cart = await cartService.retrieveWithTotals(id)

  const [discounts, count] = await cartService.getListCoupon(
    req.filterableFields,
    req.listConfig,
    cart,
    loggedInUser.id,
  )
  res.status(200).json({ discounts, count })
}

export class ListCouponAvailableParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsString()
  order?: string

  @IsOptional()
  @IsEnum(DiscountType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      DiscountType,
    ).join(', ')})`,
  })
  type?: DiscountType

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsString()
  @IsOptional()
  expand?: string
}
export default listCouponAvailable
