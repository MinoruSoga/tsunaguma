import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { EventBusService } from '../../../modules/event/event-bus.service'
import { isAdmin } from '../../user/constant'
import {
  ReturnDeliveryOriginEnum,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'
import { ReturnDeliveryService } from '../service/return-delivery.service'

/**
 * @oas [post] /return-delivery/cms
 * operationId: "CreateReturnDeliveryCms"
 * summary: "Create return delivery cms"
 * description: "create return delivery cms"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/ReturnDeliveryCmsReq"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ReturnDelivery
 * responses:
 *   201:
 *     description: Created
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
  const validated: ReturnDeliveryCmsReq = await validator(
    ReturnDeliveryCmsReq,
    req.body,
  )

  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService
  const manager = req.scope.resolve<EntityManager>('manager')
  const returnDeliveryService = req.scope.resolve<ReturnDeliveryService>(
    ReturnDeliveryService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const ids = []
  await manager.transaction(async (tx) => {
    const return_delivery = await returnDeliveryService
      .withTransaction(tx)
      .create_(validated, loggedInUser)

    ids.push(return_delivery.id)
  })

  await eventBusService.emit(ReturnDeliveryService.Events.REQUESTED, {
    id: ids,
    format: 'return-delivery-requested-shop',
  })

  res.sendStatus(201)
}

/**
 * @schema ReturnDeliveryCmsReq
 * title: "ReturnDeliveryCmsReq"
 * description: "Return Delivery Cms Req"
 * x-resourceId: ReturnDeliveryCmsReq
 * type: object
 * required:
 *   - variant_id
 *   - store_id
 *   - quantity
 * properties:
 *   store_id:
 *     type: string
 *   variant_id:
 *     type: string
 *   status:
 *     $ref: "#/components/schemas/ReturnDeliveryStatus"
 *   quantity:
 *     type: number
 *   origin:
 *     $ref: "#/components/schemas/ReturnDeliveryOriginEnum"
 *   note:
 *     type: string
 *   reason:
 *     type: string
 *   delivery_slip_no:
 *     type: string
 *   is_pause:
 *     type: boolean
 *   metadata:
 *     type: object
 */

export class ReturnDeliveryCmsReq {
  @IsString()
  variant_id: string

  @IsEnum(ReturnDeliveryStatus, {
    always: true,
    message: `Invalid value (authen type must be one of following values: ${Object.values(
      ReturnDeliveryStatus,
    ).join(', ')})`,
  })
  @IsOptional()
  status?: ReturnDeliveryStatus.REQUESTED

  @IsNumber()
  @Min(1, { message: 'Quantity can not be less than 1' })
  quantity: number

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  delivery_slip_no?: string

  @IsOptional()
  @IsBoolean()
  is_pause?: false

  @IsOptional()
  @IsEnum(ReturnDeliveryOriginEnum, {
    always: true,
    message: `Invalid value (authen type must be one of following values: ${Object.values(
      ReturnDeliveryOriginEnum,
    ).join(', ')})`,
  })
  origin?: ReturnDeliveryOriginEnum

  @IsString()
  store_id: string
}
