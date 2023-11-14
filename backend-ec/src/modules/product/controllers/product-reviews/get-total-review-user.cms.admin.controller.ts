import { IsNotEmpty, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [get] /product-reviews/{id}/total
 * operationId: GetTotalProductReviewByUser
 * summary: Get total product reviews by user
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The user's ID.
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
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             total:
 *               type: integer
 *               description: total
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

const getTotalProductReview = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    'productReviewsService',
  )

  const { id } = req.params

  const total = await productReviewsService.getTotalProductReviewByUser(
    id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ total })
}
export default getTotalProductReview

export class GetTotalProductReviewsParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsNotEmpty()
  @IsOptional()
  month?: string

  @IsNotEmpty()
  @IsOptional()
  year?: string
}
