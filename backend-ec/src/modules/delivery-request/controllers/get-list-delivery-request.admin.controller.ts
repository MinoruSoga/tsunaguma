import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { UserStatus, UserType } from '../../user/entity/user.entity'
import { DeliveryRequestStatus } from '../entities/delivery-request.entity'
import DeliveryRequestService from '../services/delivery-request.service'

/**
 * @oas [get] /delivery-requests
 * operationId: "GetListDeliveryRequests"
 * summary: "Get list delivery requests"
 * description: "GetListDeliveryRequests"
 * x-authenticated: true
 * parameters:
 *   - (query) status {string} The status
 *   - (query) limit=8 {integer} The number record of a page
 *   - (query) q {string} The query to search
 *   - (query) offset=0 {integer} The offset
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
 *          required:
 *            - delivery_requests
 *            - count
 *          properties:
 *             delivery_requests:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/delivery_request"
 *             count:
 *               type: integer
 *               description: The total number of items available
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

  const params = await validator(ListDeliveryRequestParams, req.query)
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )

  const [data, count] = await deliveryRequestService.listAndCount(
    {
      status: params.status,
      q: params.q,
      store_id: loggedInUser.store_id,
    },
    {
      skip: params.offset,
      take: params.limit,
    },
  )

  if (params.status) {
    const statuses = params.status.split(',') as DeliveryRequestStatus[]

    await Promise.all(
      data.map(async (e) => {
        return await deliveryRequestService.decorateDelivery(
          e,
          statuses,
          (params?.q as string) || undefined,
        )
      }),
    )
  } else {
    await Promise.all(
      data.map(async (e) => {
        return await deliveryRequestService.decorateDelivery(
          e,
          undefined,
          (params?.q as string) || undefined,
        )
      }),
    )
  }

  res.json({
    delivery_requests: data,
    count,
  })
}

export class ListDeliveryRequestParams {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  limit = 8

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset = 0

  @IsString()
  @IsOptional()
  q: string

  @IsString()
  @IsOptional()
  status: string
}
