import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { FavoriteService } from '../services/favorite.service'
import { LoggedInUser } from './../../../interfaces/loggedin-user'

/**
 * @oas [put] /store/{id}/follow
 * operationId: "FollowStore"
 * summary: "Follow/Unfollow a store"
 * description: "Follow/Unfollow a store"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the store.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   204:
 *     description: OK
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
  const { id } = req.params
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const favoriteService: FavoriteService = req.scope.resolve(
    FavoriteService.resolutionKey,
  )

  await favoriteService.addStore({ store_id: id, user_id: loggedInUser.id })

  res.sendStatus(204)
}
