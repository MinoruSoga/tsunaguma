import { BaseEntity } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ViewedProductService } from '../viewed-product.service'
/**
 * @oas [put] /viewed-products
 * operationId: "UpdateViewedProducts"
 * summary: "update rencently viewed products"
 * description: "update rencently viewed products"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateViewedProductReq"
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: ok
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             viewed_product:
 *                $ref: "#/components/schemas/ViewedProduct"
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
const updateViewedProductController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const viewedProductService = req.scope.resolve(
    'viewedProductService',
  ) as ViewedProductService

  const validated: UpdateViewedProductReq = await validator(
    UpdateViewedProductReq,
    req.body,
  )

  const userId = req.user?.id ?? req.user?.customer_id

  const result = await viewedProductService.updateViewedProducts(
    validated,
    userId,
  )

  res.status(200).json({
    viewed_product: result,
  })
}

/**
 * @schema UpdateViewedProductReq
 * title: "UpdateViewedProductReq"
 * description: "Update Viewed Product Req"
 * x-resourceId: UpdateViewedProductReq
 * type: object
 * required:
 *   - product_id
 *   - tmp_user_id
 * properties:
 *   product_id:
 *     description: "The id of the product"
 *     type: string
 *     example: prod_01GK6HJ9SX0VE59ZZATQCXACT2
 *   tmp_user_id:
 *     description: "Uuid"
 *     type: string
 *     example: tusr_01GK6HJ9SX0VE59ZZATQCXACT2
 */
export class UpdateViewedProductReq extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  product_id: string

  @IsString()
  @IsNotEmpty()
  tmp_user_id: string
}
export default updateViewedProductController
