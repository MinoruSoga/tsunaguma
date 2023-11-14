import { IsOptional } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [get] /reviewed-products
 * operationId: "GetReviewedProducts"
 * description: "Get Reviewed Products"
 * summary: "Get Reviewed Products"
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) user_id {string} The user_id of product reviews
 * tags:
 *   - Product
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *            type: object
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

const getReviewedProducts = async (req: MedusaRequest, res: Response) => {
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    'productReviewsService',
  )
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const userId = (req.filterableFields.user_id || loggedInUser.id) as string

  const [reviews, count] = await productReviewsService.getReviewedProducts(
    userId,
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
export default getReviewedProducts

export class GetProductReviewsParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsOptional()
  order?: string

  @IsOptional()
  user_id?: string
}
