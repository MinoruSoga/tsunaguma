import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsType } from '@medusajs/medusa/dist/utils/validators/is-type'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { FavoriteService, OrderByType } from '../services/favorite.service'

/**
 * @oas [get] /favorite/product
 * operationId: "GetProductFavorite"
 * summary: "get product favorite"
 * description: "Get product favorite"
 * x-authenticated: false
 * parameters:
 *   - in: query
 *     name: take
 *     schema:
 *       type: integer
 *     description: The numbers of items to return
 *   - in: query
 *     name: page
 *     schema:
 *       type: integer
 *     description: current page
 *   - in: query
 *     name: order_by
 *     schema:
 *       type: string
 *     description: order by
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
 *   - in: query
 *     name: product_empty
 *     schema:
 *       type: number
 *     description: filter product empty
 *   - in: query
 *     name: tmp_user_id
 *     schema:
 *       type: string
 *     description: Uuid
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
 *                    $ref: '#/components/schemas/product'
 *                count:
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
  const validated: ProductFavoriteQueryParams = await validator(
    ProductFavoriteQueryParams,
    req.query,
  )
  let userId = null
  if (req.user && req.user.id) {
    userId = req.user.id
  }

  const { items, count } = await favoriteService.listFavorites(
    validated,
    userId,
  )

  res.send({
    items: items,
    count: count,
  })
}

/**
 * @schema ProductFavoriteQueryParams
 * title: "ProductFavoriteQueryParams"
 * description: "product Favorite query params"
 * x-resourceId: ProductFavoriteQueryParams
 * type: object
 * properties:
 *  take:
 *    type: number
 *    description: number item
 *    example: 10
 *  page:
 *    type: number
 *    description: page number
 *    example: 2
 *  order_by:
 *    type: string
 *    description: order by
 *    example: DESC
 *  status:
 *     oneOf:
 *      - type: string
 *        description: a single product status
 *      - type: array
 *        description: multiple product status
 *        items:
 *          type: string
 *  product_empty:
 *    type: number
 *    description: filter product empty
 *  tmp_user_id:
 *    type: string
 *    description: Uuid
 */

export class ProductFavoriteQueryParams {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  take = 20

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page = 1

  @IsOptional()
  @IsEnum(OrderByType, { each: true })
  order_by = OrderByType.CREATED_AT_DESC

  @IsType([String, [String]])
  @IsOptional()
  status?: string | string[]

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  product_empty?: number

  @IsString()
  @IsNotEmpty()
  tmp_user_id: string
}
