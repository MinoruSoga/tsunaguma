import { PricingService, Product } from '@medusajs/medusa'
import { PriceSelectionContext } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsType } from '@medusajs/medusa/dist/utils/validators/is-type'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { FavoriteService } from '../services/favorite.service'

/**
 * @oas [get] /list-favorite-product-by-store/{id}
 * operationId: "GetProductFavoriteByStore"
 * summary: "get product favorite by store"
 * description: "Get product favorite by store"
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The Id of store
 *   - (query) limit=10 {integer} Limit the number of products returned.
 *   - (query) offset=0 {integer} How many products to skip in the result.
 *   - (query) order {string} order by
 *   - (query) product_empty {integer} filter product empty
 *   - (query) tmp_user_id=* {string} uuid
 *   - in: query
 *     name: status
 *     description: status of product
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           description: a single product status
 *         - type: array
 *           description: multiple product status
 *           items:
 *             type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Favorite
 * responses:
 *   200:
 *     description: ok
 *     content:
 *       application/json:
 *         schema:
 *            type: object
 *            properties:
 *                items:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/ProductFavorite'
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
export default async (req: MedusaRequest, res: Response) => {
  const favoriteService = req.scope.resolve(
    'favoriteService',
  ) as FavoriteService
  const tempPriceContext: PriceSelectionContext = {
    currency_code: JAPANESE_CURRENCY_CODE,
  }

  const validated: ProductFavoriteByStoreQueryParams = await validator(
    ProductFavoriteByStoreQueryParams,
    req.query,
  )
  const { id } = req.params

  const [result, total] = await favoriteService.listFavoriteProductByStore(
    req.filterableFields,
    req.listConfig,
    id,
    validated,
  )

  let userId = null
  if (req?.user && req?.user?.id) {
    userId = req.user.id
  }

  const pricingService: PricingService = req.scope.resolve('pricingService')

  const products = await pricingService.setProductPrices(
    result.map((r) => r.product),
    tempPriceContext,
  )

  result.forEach((item) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    item.product = {
      ...(products.find((p) => p.id === item.product.id) as Product),
      is_liked:
        item.user_id === userId || item.tmp_user_id === validated.tmp_user_id,
    }
  })

  res.send({
    items: result,
    total,
  })
}

export class ProductFavoriteByStoreQueryParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsOptional()
  order?: string

  @IsType([String, [String]])
  @IsOptional()
  status?: string | string[]

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  product_empty?: number

  @IsString()
  tmp_user_id: string
}
