import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ReturnDeliveryService } from '../service/return-delivery.service'

/**
 * @oas [delete] /return-delivery/{id}
 * operationId: "deleteReturnDeliveryAdminCms"
 * summary: "delete Return Delivery Admin Cms"
 * description: "pause Return Delivery Admin Cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Return Delivery.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ReturnDelivery
 * responses:
 *   "200":
 *      description: OK
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
const deleteReturnDeliveryController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const id = req.params.id
  const returnDeliveryService: ReturnDeliveryService = req.scope.resolve(
    'returnDeliveryService',
  )

  await returnDeliveryService.delete_(id)
  res.sendStatus(200)
}

export default deleteReturnDeliveryController
