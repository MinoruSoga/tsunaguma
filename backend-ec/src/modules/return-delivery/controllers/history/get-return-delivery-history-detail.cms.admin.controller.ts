import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ReturnDeliveryHistoryService } from '../../service/return-delivery-history.service'

/**
 * @oas [get] /return-delivery/history/{id}/cms
 * operationId: "GetDetailReturnDeliveryHistoryCms"
 * summary: "Get detail return delivery history cms"
 * description: "Retrieves a return delivery history"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Return Delivery history.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ReturnDelivery
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/return_delivery_history"
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

  const returnDeliveryHistoryService =
    req.scope.resolve<ReturnDeliveryHistoryService>(
      ReturnDeliveryHistoryService.resolutionKey,
    )

  const { id } = req.params
  const history = await returnDeliveryHistoryService.retrieve_(id)
  res.status(200).json(history)
}
