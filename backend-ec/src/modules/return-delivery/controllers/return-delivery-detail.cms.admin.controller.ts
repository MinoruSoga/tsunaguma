import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../user/constant'
import { ReturnDeliveryService } from '../service/return-delivery.service'

/**
 * @oas [get] /return-delivery/{id}
 * operationId: GetReturnDeliveryDetail
 * summary: Get return delivery detail
 * description: "get return delivery detail"
 * tags:
 *   - ReturnDelivery
 * parameters:
 *   - (path) id=* {string} The ID of the Return Delivery.
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             return_delivery:
 *               $ref: "#/components/schemas/return_delivery"
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
const getReturnDeliveryDetail = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const returnDeliveryService = req.scope.resolve<ReturnDeliveryService>(
    ReturnDeliveryService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const id = req.params.id
  const returnDelivery = await returnDeliveryService.retrieve_(id)

  res.status(200).json({ return_delivery: returnDelivery })
}
export default getReturnDeliveryDetail
