import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { UserStatus, UserType } from '../../user/entity/user.entity'
import DeliveryRequestService from '../services/delivery-request.service'

/**
 * @oas [get] /delivery-requests/products
 * operationId: "GetListDeliveryProducts"
 * summary: "Get list delivery requests"
 * description: "GetListDeliveryProducts"
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: status
 *     required: true
 *     schema:
 *       type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - DeliveryRequest
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            required:
 *              - delivery_id
 *              - title
 *            properties:
 *              delivery_id:
 *                type: string
 *              title:
 *                type: string
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
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  if (
    !loggedInUser?.id ||
    !loggedInUser.store_id ||
    loggedInUser.type !== UserType.STORE_PRIME ||
    loggedInUser.status !== UserStatus.ACTIVE
  ) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  const params = await validator(ListProductDeliveryParams, req.query)
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )

  const data = await deliveryRequestService.listProductsAndCount(
    params.status,
    loggedInUser.store_id,
  )

  res.status(200).json(data)
}

export class ListProductDeliveryParams {
  @IsString()
  status: string
}
