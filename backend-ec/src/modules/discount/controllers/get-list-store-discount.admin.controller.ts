import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { DiscountType } from '../entities/discount.entity'
import { DiscountService } from '../services/discount.service'

/**
 * @oas [get] /mystore/discounts
 * operationId: "GetMyStoreDiscounts"
 * summary: "list My Store Discounts."
 * description: "Retrieve a list of Product history."
 * x-authenticated: true
 * parameters:
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

const getListStoreDiscount = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const discountService: DiscountService = req.scope.resolve('discountService')

  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser
  if (!loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Store is required!')
  }
  const [discounts, count] = await discountService.getStoreListDiscount(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ discounts, count })
}

export class GetListStoreDiscountParams {
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
export default getListStoreDiscount
