import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [put] /review/order
 * operationId: "UpdateOrderReviews"
 * summary: "Create a product review"
 * x-authenticated: true
 * description: "Update order reviews"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateOrderReviewReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Review
 * responses:
 *   "200":
 *     description: OK
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
const updateOrderReview = async (req: MedusaRequest, res: Response) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const productReviewsService: ProductReviewsService = req.scope.resolve(
    ProductReviewsService.resolutionKey,
  )

  const validated = await validator(UpdateOrderReviewReq, req.body)
  await productReviewsService.update(loggedInUser.id, validated)

  res.sendStatus(200)
}

export default updateOrderReview

/**
 * @schema UpdateOrderReviewReq
 * title: "UpdateOrderReviewReq"
 * description: "Product Reviews Store Params"
 * x-resourceId: UpdateOrderReviewReq
 * type: object
 * required:
 *   - order_id
 *   - product_reviews
 * properties:
 *   order_id:
 *     description: "Order id"
 *     type: string
 *   product_reviews:
 *     description: "Product reviews"
 *     type: array
 *     items:
 *       $ref: '#/components/schemas/UpdateOrderReviewItem'
 */
export class UpdateOrderReviewReq {
  @IsString()
  order_id: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderReviewItem)
  @ArrayUnique((o) => o.review_id, {
    message: 'Review id cannot be duplicated.',
  })
  product_reviews: UpdateOrderReviewItem[]
}

/**
 * @schema UpdateOrderReviewItem
 * title: "UpdateOrderReviewItem"
 * description: "Params store product review"
 * x-resourceId: UpdateOrderReviewItem
 * type: object
 * required:
 *   - review_id
 * properties:
 *   review_id:
 *     description: "Review id"
 *     type: string
 *   rate:
 *     description: "Rate min: 1, max: 5 required if is not empty parent_id"
 *     type: number
 *     example: 5
 *   content:
 *     description: "Content product review"
 *     type: string
 */
export class UpdateOrderReviewItem {
  @IsString()
  review_id: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rate: number

  @IsString()
  @IsOptional()
  content?: string
}
