import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { CacheService } from 'src/modules/cache/cache.service'

import { FavoriteService } from '../services/favorite.service'

/**
 * @oas [put] /favorite/product
 * operationId: "AddFavoriteProduct"
 * summary: "add favorite product"
 * description: "add favorite product"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AddProductFavoriteReq"
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Favorite
 * responses:
 *   200:
 *     description: ok
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
  const validated: AddProductFavoriteReq = await validator(
    AddProductFavoriteReq,
    req.body,
  )

  const userId = req.user?.id ?? req.user?.customer_id

  await favoriteService.addProductFavorite(validated, userId)
  const cacheService: CacheService = req.scope.resolve('cacheService')
  await cacheService.invalidate(`prod-detail-${validated.product_id}`)
  res.send('sucess')
}

/**
 * @schema AddProductFavoriteReq
 * title: "AddProductFavoriteReq"
 * description: "Add Product Favorite Req"
 * x-resourceId: AddProductFavoriteReq
 * type: object
 * required:
 *   - product_id
 *   - tmp_user_id
 *   - is_liked
 * properties:
 *   product_id:
 *     description: "The id of the product"
 *     type: string
 *     example: prod_01GK6HJ9SX0VE59ZZATQCXACT2
 *   tmp_user_id:
 *     description: "Uuid"
 *     type: string
 *     example: tusr_01GK6HJ9SX0VE59ZZATQCXACT2
 *   is_liked:
 *     description: "Like status"
 *     type: boolean
 *     example: true
 */

export class AddProductFavoriteReq {
  @IsNotEmpty()
  @IsString()
  product_id: string

  @IsString()
  @IsNotEmpty()
  tmp_user_id: string

  @IsBoolean()
  is_liked: boolean
}
