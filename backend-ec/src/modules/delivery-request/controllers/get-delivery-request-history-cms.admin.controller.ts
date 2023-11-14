import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { DeliveryRequestHistoryService } from '../services/delivery-request-history.service'

/**
 * @oas [get] /delivery-request/history/{id}/cms
 * operationId: "GetDeliveryRequestHistoryCms"
 * summary: "Get delivery request history cms"
 * description: "Retrieves a delivery request history"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the delivery request history.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - DeliveryRequest
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *               $ref: "#/components/schemas/delivery_request_history"
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
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const deliveryRequestHistoryService =
    req.scope.resolve<DeliveryRequestHistoryService>(
      DeliveryRequestHistoryService.resolutionKey,
    )

  const { id } = req.params
  const history = await deliveryRequestHistoryService.getOne(id)
  res.status(200).json(history)
}
