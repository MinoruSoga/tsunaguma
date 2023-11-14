import { Type } from 'class-transformer'
import { IsNumber, IsOptional } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaRequest } from 'medusa-extender'

import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [get] /products/{id}/reviews
 * operationId: "GetProductReviews"
 * description: "Get product reviews."
 * summary: "Get product reviews"
 * parameters:
 *   - (path) id=* {string} The product ID.
 *   - (query) limit= {string}.
 *   - (query) offset= {string}.
 * tags:
 *   - Product
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *            required:
 *              - reviews
 *              - count
 *            properties:
 *               reviews:
 *                  type: array
 *                  items:
 *                   $ref: "#/components/schemas/product_reviews"
 *               count:
 *                 type: number
 *  "400":
 *    $ref: "#/components/responses/400_error"
 *  "404":
 *    $ref: "#/components/responses/not_found_error"
 *  "409":
 *    $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *    $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *    $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaRequest, res: Response) => {
  const { id } = req.params
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    ProductReviewsService.resolutionKey,
  )

  const [reviews, count] = await productReviewsService.reviewsByProduct(
    id,
    req.filterableFields,
    req.listConfig,
  )

  let result: any = reviews

  if (Array.isArray(reviews)) {
    result = reviews.map((review) => ({
      ...review,
      variant: _.pick(review.variant, ['id', 'sku', 'options']),
      user: _.pick(review.user, ['id', 'nickname']),
      order: _.pick(review.order, ['id']),
      product: _.pick(review.product, ['id', 'title', 'thumbnail', 'store_id']),
    }))
  }

  res.json({ reviews: result, count })
}

export const defaultProductReviewsFields = [
  'id',
  'rate',
  'content',
  'reply_cnt',
  'parent_id',
  'variant_id',
  'order_id',
  'product_id',
  'user_id',
  'created_at',
  'updated_at',
]

export const defaultProductRelations = ['variant', 'order', 'product', 'user']

export class ProductReviewParams {
  // @IsString()
  // @IsOptional()
  // fields?: string

  // @IsString()
  // @IsOptional()
  // expand?: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20
}
