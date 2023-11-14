import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { DeliveryRequest } from '../entities/delivery-request.entity'
import DeliveryRequestService from '../services/delivery-request.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  const validated = await validator(DeliveryRequestParams, req.query)
  // eslint-disable-next-line prefer-const
  let { expands, fields } = validated

  const config: FindConfig<DeliveryRequest> = {}

  if (!_.isNil(fields) && fields !== '') {
    config.select = fields.split(',') as (keyof DeliveryRequest)[]
  }

  if (!_.isNil(expands) && expands !== '') {
    config.relations = expands.split(',')
  }

  const deliveryRequest = await deliveryRequestService.retrieve(
    {
      id: req.params.id,
      store_id: loggedInUser.store_id,
    },
    config,
  )

  if (deliveryRequest.children) {
    deliveryRequest.children.sort((a, b) => Number(a.rank) - Number(b.rank))
  }

  res.json(deliveryRequest)
}

class DeliveryRequestParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsString()
  @IsOptional()
  expands?: string
}

/**
 * @oas [get] /delivery-request/{id}
 * operationId: "GetMyDeliveryRequest"
 * summary: "Get my delivery request"
 * description: "Retrieves a my delivery request."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the delivery request.
 *   - (query) fields= {string} The fields want to get.
 *   - (query) expands= {string} The relations want to get.
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
 *               $ref: "#/components/schemas/delivery_request"
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
