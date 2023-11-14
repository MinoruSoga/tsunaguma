import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { StoreDetailService } from '../../services/store-detail.service'

/**
 * @oas [get] /store-detail/{id}/cms
 * operationId: "GetStoreDetailCms"
 * summary: "get store detail by user"
 * description: "get store detail by user."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The id of user.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Profile
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/store_detail"
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
 *
 */
const getStoreDetailCms = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const { id } = req.params
  const storeDetailService: StoreDetailService =
    req.scope.resolve('storeDetailService')
  const store = (await storeDetailService.retrieveByUser(id, false)) || {}
  res.status(200).json(store)
}
export default getStoreDetailCms
