import { Type } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { FavoriteService } from '../services/favorite.service'
/**
 * @oas [get] /my-followers
 * operationId: "GetMyFollowers"
 * summary: "Get my followers"
 * description: "Get my followers"
 * x-authenticated: true
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The number of follower to skip before starting to collect the follower set
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Favorite
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             followers:
 *               type: array
 *               items:
 *                 allOf:
 *                  - $ref: "#/components/schemas/StoreFavorite"
 *                  - type: object
 *                    properties:
 *                      is_followed:
 *                        type: boolean
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

const getMyFollowers = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const favoriteService = req.scope.resolve(
    'favoriteService',
  ) as FavoriteService

  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser
  if (!loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Store is required!')
  }
  const [followers, count] = await favoriteService.getMyFollowers(
    loggedInUser?.store_id,
    req.filterableFields,
    req.listConfig,
  )

  let result: any = followers

  // if (loggedInUser.store_id) {
  result = await Promise.all(
    followers.map(async (follower) => {
      if (!follower.user?.store_id) return follower

      const isFollowed = await favoriteService.checkFollow(
        loggedInUser.id,
        follower.user.store_id,
      )

      return Object.assign(follower, { is_followed: isFollowed })
    }),
  )
  // }

  res.status(200).json({ followers: result, count })
}

export class GetMyFollowersParams {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number
}

export default getMyFollowers
