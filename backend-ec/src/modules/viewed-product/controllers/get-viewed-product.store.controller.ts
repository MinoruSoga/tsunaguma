import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ViewedProductService } from '../viewed-product.service'
/**
 * @oas [get] /viewed-products
 * operationId: "GetViewedProducts"
 * summary: "get rencently viewed products"
 * description: "get rencently viewed products"
 * x-authenticated: true
 * parameters:
 *   - (query) limit=10 {integer} Limit the number of viewed products returned.
 *   - (query) offset=0 {integer} How many viewed products to skip in the result.
 *   - (query) tmp_user_id=* {string} Temporary user id set when before user login
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
 *            type: object
 *            properties:
 *                products:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/product'
 *                total:
 *                  type: integer
 *                  description: count result
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
const getViewedProducts = async (req: MedusaRequest, res: Response) => {
  const viewedProductService = req.scope.resolve(
    'viewedProductService',
  ) as ViewedProductService

  let userId = null
  if (req.user && req.user.id) {
    userId = req.user.id
  }

  const [result, total] = await viewedProductService.getListViewedProducts(
    req.filterableFields,
    req.listConfig,
    userId,
  )
  const response = {
    // TODO: debug null error
    products: result
      .filter((item) => !!item.product)
      .map((item) => ({
        id: item.product.id,
        title: item.product.title,
        thumbnail: item.product.thumbnail,
        tmp: item.tmp_user_id,
        userId: item.user_id,
        updateAt: item.updated_at,
      })),
    total,
  }

  res.send(response)
}

export class GetListViewedProductParams {
  @IsString()
  tmp_user_id: string

  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}

export default getViewedProducts
