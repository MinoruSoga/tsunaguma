import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { FavoriteService } from '../services/favorite.service'

/**
 * @oas [post] /favorite/sync-product
 * operationId: "SyncProductFavorite"
 * summary: "Sync product favorite"
 * description: "Sync product favorite"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/SyncProductFavoriteReq"
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
  const validated: ProductFavoriteReq = await validator(
    ProductFavoriteReq,
    req.body,
  )
  let userId = null
  if (req.user && req.user.id) {
    userId = req.user.id
  }
  await favoriteService.syncFavoriteProduct(validated, userId)

  res.sendStatus(200)
}

/**
 * @schema SyncProductFavoriteReq
 * title: "SyncProductFavoriteReq"
 * description: "Sync Product Favorite Request"
 * x-resourceId: SyncProductFavoriteReq
 * type: object
 * properties:
 *  tmp_user_id:
 *    type: string
 *    description: Uuid
 */
export class ProductFavoriteReq {
  @IsString()
  @IsNotEmpty()
  tmp_user_id: string
}
