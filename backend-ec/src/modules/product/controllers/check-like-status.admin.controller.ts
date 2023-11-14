import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsArray, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ProductService } from './../services/product.service'

/**
 * @oas [post] /product-favorites
 * operationId: "CheckProductFavoriteStatus"
 * summary: "CheckProductFavoriteStatus"
 * description: "CheckProductFavoriteStatus"
 * x-authenticated: false
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         properties:
 *           tmp_user_id:
 *             type: string
 *           user_id:
 *             type: string
 *           product_ids:
 *             description: A list of Product Ids
 *             type: array
 *             items:
 *               type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *              type: string
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

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const validated = await validator(CheckLikeStatusReq, req.body)
  const productService = req.scope.resolve('productService') as ProductService

  const ids = await productService.checkFavoriteStatus(validated)

  res.json(ids)
}

export class CheckLikeStatusReq {
  @IsString()
  @IsOptional()
  user_id?: string

  @IsString()
  @IsOptional()
  tmp_user_id: string

  @IsArray()
  @IsString({ each: true })
  product_ids: string[]
}
