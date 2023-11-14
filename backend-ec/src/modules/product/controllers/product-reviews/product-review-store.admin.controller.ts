import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [post] /products/reviews
 * operationId: "PostProductReviews"
 * summary: "Create a product review"
 * x-authenticated: true
 * description: "Creates a product review"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ProductReviewsStoreParams"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
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
const productReviewStoreController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const productReviewsService: ProductReviewsService = req.scope.resolve(
    ProductReviewsService.resolutionKey,
  )

  const validated = await validator(ProductReviewsStoreParams, req.body)
  await productReviewsService.create(validated, loggedInUser)

  res.sendStatus(200)
}

export default productReviewStoreController

/**
 * @schema ProductReviewsStoreParams
 * title: "ProductReviewsStoreParams"
 * description: "Product Reviews Store Params"
 * x-resourceId: ProductReviewsStoreParams
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
 *       $ref: '#/components/schemas/GetProductReviewStoreParam'
 */
export class ProductReviewsStoreParams {
  @IsString()
  order_id: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetProductReviewStoreParam)
  // @ArrayUnique((o) => o.variant_id, {
  //   message: 'Variant id cannot be duplicated.',
  // })
  product_reviews: GetProductReviewStoreParam[]
}

/**
 * @schema GetProductReviewStoreParam
 * title: "GetProductReviewStoreParam"
 * description: "Params store product review"
 * x-resourceId: GetProductReviewStoreParam
 * type: object
 * required:
 *   - product_id
 *   - variant_id
 *   - line_item_id
 * properties:
 *   line_item_id:
 *     type: string
 *   variant_id:
 *     description: "Variant id"
 *     type: string
 *   rate:
 *     description: "Rate min: 1, max: 5 required if is not empty parent_id"
 *     type: number
 *     example: 5
 *   content:
 *     description: "Content product review"
 *     type: string
 *   parent_id:
 *     description: "Parent id product reviews"
 *     type: string
 */
export class GetProductReviewStoreParam {
  @IsString()
  product_id: string

  @IsString()
  variant_id: string

  @IsString()
  line_item_id: string

  @ValidateIf((o) => !o.parent_id)
  @IsNumber()
  @Min(1)
  @Max(5)
  rate: number

  @IsString()
  @IsOptional()
  content?: string

  @IsString()
  @IsOptional()
  parent_id?: string
}
