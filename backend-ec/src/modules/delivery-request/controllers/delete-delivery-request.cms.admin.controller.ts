import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { EventBusService } from '../../event/event-bus.service'
import { isAdmin } from '../../user/constant'
import DeliveryRequestService from '../services/delivery-request.service'
import { DeliveryRequestHistoryService } from '../services/delivery-request-history.service'

/**
 * @oas [delete] /delivery-request/{id}
 * operationId: "deleteDeliveryRequest"
 * summary: "delete delivery request"
 * description: "delete delivery request"
 * parameters:
 *   - (path) id=* {string} The ID of the delivery.
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - DeliveryRequest
 * responses:
 *   200:
 *     description: Ok
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
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

  const { id } = req.params
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )

  const deliveryRequestHistoryService =
    req.scope.resolve<DeliveryRequestHistoryService>(
      DeliveryRequestHistoryService.resolutionKey,
    )

  const delivery = await deliveryRequestService.retrieve({ id: id })

  if (!delivery.parent_id) {
    await deliveryRequestService.delete(id)
  } else {
    if (isUserAdmin) {
      await deliveryRequestHistoryService.create_(
        loggedInUser.id,
        delivery.parent_id,
        true,
      )
    }
    await deliveryRequestService.delete(id, false)
    await eventBusService.emit(DeliveryRequestService.Events.DELETE, {
      id: delivery.parent_id,
    })
  }

  res.sendStatus(200)
}
