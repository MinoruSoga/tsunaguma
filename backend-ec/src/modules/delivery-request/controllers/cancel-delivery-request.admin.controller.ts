// *** CAUTION ***
// only for pending

import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { IsNull, Not } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isActive, isStorePrime } from '../../user/constant'
import { DeliveryRequestStatus } from '../entities/delivery-request.entity'
import DeliveryRequestService from '../services/delivery-request.service'

/**
 * @oas [post] /delivery-request/cancel/{id}
 * operationId: "CancelDeliveryRequest"
 * summary: "cancel delivery request"
 * description: "cancel delivery request"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the delivery request.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - DeliveryRequest
 * responses:
 *   200:
 *     description: Success
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

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  if (
    !loggedInUser?.id ||
    !loggedInUser.store_id ||
    !isStorePrime(loggedInUser) ||
    !isActive(loggedInUser)
  ) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  const deliveryReq = await deliveryRequestService.retrieve(
    {
      store_id: loggedInUser.store_id,
      id: req.params.id,
      parent_id: Not(IsNull()),
    },
    { select: ['id', 'status'] },
  )

  // only pending delivery status can be canceled
  if (deliveryReq.status !== DeliveryRequestStatus.PENDING) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `${deliveryReq.status} delivery request can not be canceled!`,
    )
  }

  await deliveryRequestService.cancel(deliveryReq.id)

  res.status(200).send('OK')
}
