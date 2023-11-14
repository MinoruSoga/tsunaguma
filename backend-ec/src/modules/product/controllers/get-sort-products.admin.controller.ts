import { IsEnum, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ProductStatusEnum } from '../entity/product.entity'
import { ProductSortService } from '../services/product-sort.service'
/**
 * @oas [get] /myproducts/sort
 * operationId: "GetSortProducts"
 * summary: "list All Sort Product of Store."
 * description: "Retrieve a list of Sort Product by store_id."
 * x-authenticated: false
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - in: query
 *     name: status
 *     required: true
 *     schema:
 *       $ref: "#/components/schemas/ProductStatusEnum"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/product"
 *             count:
 *               type: integer
 *               description: The total number of items available
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

const getListSortProductsController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const productSortService = req.scope.resolve<ProductSortService>(
    ProductSortService.resolutionKey,
  )

  if (!loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store already')
  }

  const [products, count] = await productSortService.listSortProducts(
    loggedInUser.store_id,
    req.filterableFields as any,
    req.listConfig,
  )

  res.status(200).json({ products, count })
}
export default getListSortProductsController

export class GetSortProductReq {
  @IsEnum(ProductStatusEnum, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      ProductStatusEnum,
    ).join(', ')})`,
  })
  status: ProductStatusEnum
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}

export const defaultSortProductsFields = [
  'id',
  'title',
  'thumbnail',
  'created_at',
  'shop_rank',
]
