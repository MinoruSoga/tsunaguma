import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { UserCouponService } from '../../services/user-coupon.service'

/**
 * @oas [get] /user-coupons
 * operationId: "GetListUserCoupon"
 * summary: "get List Coupon of User."
 * description: "get List Coupon of User."
 * x-authenticated: true
 * parameters:
 *   - (query) fields {string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) limit {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each product of the result.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User-coupon
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             coupons:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/user_coupon"
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

const getListUserCoupon = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login!')
  }

  const userCouponService: UserCouponService =
    req.scope.resolve('userCouponService')

  const [coupons, count] = await userCouponService.list(
    req.filterableFields,
    req.listConfig,
    loggedInUser.id,
  )
  res.status(200).json({ coupons, count })
}

export class GetListUserCouponParams {
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

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsString()
  @IsOptional()
  expand?: string
}
export default getListUserCoupon
