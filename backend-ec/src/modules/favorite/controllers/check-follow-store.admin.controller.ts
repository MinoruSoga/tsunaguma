import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsArray, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { FavoriteService } from '../services/favorite.service'
import { LoggedInUser } from './../../../interfaces/loggedin-user'

/**
 * @oas [post] /follow/check-follow
 * operationId: "CheckFollowStore"
 * summary: "Check follow stores"
 * description: "Check follow stores"
 * x-authenticated: true
 * requestBody:
 *   description: Check follow stores
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - ids
 *         properties:
 *           ids:
 *             type: array
 *             items:
 *               type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Favorite
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *        schema:
 *           type: array
 *           items:
 *               type: string
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
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const favoriteService: FavoriteService = req.scope.resolve(
    FavoriteService.resolutionKey,
  )
  const data = await validator(CheckFollowStoreReq, req.body)

  const result = await favoriteService.checkFollowStores(
    loggedInUser.id,
    data.ids,
  )

  res.json(result)
}

export class CheckFollowStoreReq {
  @IsArray()
  @IsString({ each: true })
  ids: string[]
}
