import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { DiscountType } from '../entities/discount.entity'
import { DiscountService } from '../services/discount.service'

/**
 * @oas [get] /discounts/available
 * operationId: "GetDiscountsAvailable"
 * summary: "list Discounts Available."
 * description: "Retrieve a list Discounts Available."
 * x-authenticated: false
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

const listDiscountAvailable = async (req: MedusaRequest, res: Response) => {
  const discountService: DiscountService = req.scope.resolve('discountService')

  let userId = null
  if (req.user && req.user.id) {
    userId = req.user.id
  }

  const [discounts, count] = await discountService.getListDiscount(
    req.filterableFields,
    req.listConfig,
    userId,
  )

  res.status(200).json({ discounts, count })
}

export class ListDiscountAvailableParams {
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
export default listDiscountAvailable
