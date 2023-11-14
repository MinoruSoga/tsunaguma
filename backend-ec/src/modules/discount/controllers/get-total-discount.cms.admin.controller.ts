import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { DiscountType } from '../entities/discount.entity'
import { DiscountService } from '../services/discount.service'

/**
 * @oas [get] /store/discounts/{id}/cms
 * operationId: "GetStoreDiscounts"
 * summary: "get discounts of a store."
 * description: "Get discounts of a store."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
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
 *             discount_total:
 *               type: integer
 *               description: The total of items available
 *             discount_amount:
 *               type: integer
 *               description: The amount of items available
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

const getTotalStoreDiscount = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const discountService: DiscountService = req.scope.resolve('discountService')

  const { id } = req.params
  let type = undefined
  req.filterableFields.type
    ? (type = req.filterableFields.type)
    : (type = DiscountType.PROMO_CODE)

  delete req.listConfig.take
  delete req.listConfig.skip

  const count = await discountService.getStoreTotalDiscount(id, type)
  const amount = await discountService.getPCAmount(id, type)
  res.status(200).json({ discount_total: count, discount_amount: amount })
}

export class GetTotalStoreDiscountParams {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20

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
}
export default getTotalStoreDiscount
