import { IsNotEmpty, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [get] /product-reviews/{id}/store
 * operationId: GetTotalProductReviewByStore
 * summary: Get total product reviews by store
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The store's ID.
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
 *             rate:
 *               type: integer
 *               description: rate
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

const getTotalReviewStore = async (req: MedusaRequest, res: Response) => {
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    'productReviewsService',
  )
  const { id } = req.params
  const total = await productReviewsService.getTotalReviewsStore(
    id,
    req.filterableFields,
  )
  res.status(200).json(total)
}
export default getTotalReviewStore

export class GetTotalReviewsStoreParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsNotEmpty()
  @IsOptional()
  month?: string

  @IsNotEmpty()
  @IsOptional()
  year?: string
}
