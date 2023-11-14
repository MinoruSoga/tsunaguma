import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { FavoriteService } from '../services/favorite.service'

/**
 * @oas [get] /list-following-store-by-store/{id}
 * operationId: "GetFollowingStoreByStore"
 * summary: "get following store by store"
 * description: "Get following store by store"
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The Id of store
 *   - (query) limit=10 {integer} Limit the number of products returned.
 *   - (query) offset=0 {integer} How many products to skip in the result.
 *   - (query) order {string} order by
 *   - (query) tmp_user_id=* {string} uuid
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
 *                    $ref: '#/components/schemas/StoreFavorite'
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
  const { id } = req.params

  const [followingStores, total] =
    await favoriteService.listFollowingStoreByStore(
      req.filterableFields,
      req.listConfig,
      id,
    )

  let userId = null
  if (req?.user && req?.user?.id) {
    userId = req.user.id
  }

  let result: any = followingStores

  result = await Promise.all(
    followingStores.map(async (followingStore) => {
      const isFollowed = userId
        ? await favoriteService.checkFollow(userId, followingStore.store_id)
        : false

      return Object.assign(followingStore, { is_followed: isFollowed })
    }),
  )

  res.send({
    items: result,
    total,
  })
}

export class FollowingStoreByStoreQueryParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsOptional()
  order?: string

  @IsString()
  tmp_user_id: string
}
