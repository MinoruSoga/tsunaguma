import { Type } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { FavoriteService } from '../services/favorite.service'
import { LOGGED_IN_USER_KEY } from './../../../helpers/constant'
import { LoggedInUser } from './../../../interfaces/loggedin-user'

/**
 * @oas [get] /favorite/store
 * operationId: "GetStoreFavorite"
 * summary: "get store favorite"
 * description: "Get product favorite"
 * x-authenticated: false
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The number of follower to skip before starting to collect the follower set
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Favorite
 * responses:
 *   201:
 *    description: ok
 *    content:
 *       application/json:
 *         schema:
 *            type: object
 *            properties:
 *                items:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/StoreFavorite'
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
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const [items, count] = await favoriteService.getStoreFavorite(
    loggedInUser?.id,
    req.filterableFields,
    req.listConfig,
  )

  res.json({
    items,
    count,
  })
}
export class StoreFavoriteQueryParams {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number
}
