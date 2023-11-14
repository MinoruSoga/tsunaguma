import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import {
  OrderByType,
  ProductReviewsService,
  SortByColumn,
} from '../../services/product-reviews.service'

/**
 * @oas [get] /products/reviews/order
 * operationId: "GetListProductReviewsByUser"
 * description: "Get all product reviews by user."
 * summary: "Get all product reviews by user."
 * parameters:
 *  - (query) limit=20 {integer} The number of collections to return.
 *  - (query) offset=0 {integer} The number of collections to skip before the results.
 *  - (query) sort_by=order {string} Sort_by order or rate.
 *  - (query) order_by=DESC {string} Order by desc | asc.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ProductReviews
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *            type: array
 *            items:
 *              $ref: "#/components/schemas/product_reviews"
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
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    ProductReviewsService.resolutionKey,
  )

  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const validated: GetProductReviewsQueryPaginationParams = await validator(
    GetProductReviewsQueryPaginationParams,
    req.query,
  )

  const { listConfig } = req
  const { skip, take } = listConfig

  const [collections, count] = await productReviewsService.listByMe(
    validated,
    loggedInUser,
  )
  let result: any = collections
  if (Array.isArray(collections)) {
    result = collections.map((review) => ({
      ...review,
      variant: _.pick(review.variant, ['id', 'sku', 'title']),
      user: _.pick(review.user, ['id', 'nickname']),
      order: _.pick(review.order, ['id']),
      product: _.pick(review.product, ['id', 'title', 'thumbnail', 'store_id']),
    }))
  }

  result = await productReviewsService.decorateReview(result)

  res.status(200).json({
    collections: result,
    count,
    offset: skip,
    limit: take,
  })
}

export class GetProductReviewsQueryPaginationParams {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0

  @IsString()
  @IsOptional()
  @IsEnum(OrderByType, { each: true })
  order_by?: string = OrderByType.DESC

  @IsString()
  @IsOptional()
  @IsEnum(SortByColumn, { each: true })
  sort_by?: string = SortByColumn.ORDER
}
