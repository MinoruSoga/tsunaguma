import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { OrderCancelType } from '../entity/order.entity'
import { OrderService } from '../services/order.service'

/**
 * @oas [post] /order/{id}/cancel
 * operationId: "OpenCancelRequest"
 * summary: "Open a cancel order request"
 * description: "Open a cancel order request"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Order.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/OpenCancelOrderRequestReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
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
const openCancelRequestController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params
  const orderService: OrderService = req.scope.resolve('orderService')
  const validated = await validator(RequestCancelParams, req.body)

  await orderService.requestCancel(id, validated)

  res.sendStatus(200)
}

export default openCancelRequestController

export class RequestCancelParams {
  @IsString()
  cancel_reason: string

  @IsEnum(OrderCancelType, {
    always: true,
    message: `Invalid value (cancel type must be one of following values: ${Object.values(
      OrderCancelType,
    ).join(', ')})`,
  })
  cancel_type: string
}

/**
 * @schema OpenCancelOrderRequestReq
 * title: "Open cancel order request Params"
 * description: "Open cancel order request Params"
 * x-resourceId: OpenCancelOrderRequestReq
 * required:
 *  - cancel_reason
 *  - cancel_type
 * properties:
 *   cancel_reason:
 *    type: string
 *   cancel_type:
 *    type: string
 *    enum: [seller, buyer]
 */
