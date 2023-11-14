import { IsNotEmpty, IsOptional } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaRequest } from 'medusa-extender'

import StoreService from '../../../store/services/store.service'
import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [get] /reviews/{id}/store
 * operationId: GetProductReviewOfStore
 * summary: Get total product reviews of store
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The store's ID.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of review
 *   - (query) order {string} The order of review
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
 *   - Review
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             reviews:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/product_reviews"
 *             count:
 *               type: integer
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

const getListReviewStore = async (req: MedusaRequest, res: Response) => {
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    'productReviewsService',
  )
  const storeService: StoreService = req.scope.resolve('storeService')
  const store = await storeService.retrieve_(req.params.id)

  const id = store.id

  const [reviews, count] = await productReviewsService.getReviewsStore(
    id,
    req.filterableFields,
    req.listConfig,
  )

  let result: any = reviews

  if (Array.isArray(reviews)) {
    result = reviews.map((review) => ({
      ...review,
      variant: _.pick(review.variant, ['id', 'sku', 'title', 'options']),
      user: _.pick(review.user, ['id', 'nickname']),
      order: _.pick(review.order, ['id']),
      product: _.pick(review.product, ['id', 'title', 'thumbnail', 'store_id']),
    }))
  }

  res.status(200).json({ reviews: result, count })
}
export default getListReviewStore

export class GetReviewsStoreParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsOptional()
  order?: string

  @IsNotEmpty()
  @IsOptional()
  month?: string

  @IsNotEmpty()
  @IsOptional()
  year?: string
}
