import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { EventBusService } from '../../../modules/event/event-bus.service'
import { UserType } from '../../user/entity/user.entity'
import {
  ReturnDeliveryOriginEnum,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'
import { ReturnDeliveryService } from '../service/return-delivery.service'

/**
 * @oas [post] /return-delivery
 * operationId: "CreateReturnDelivery"
 * summary: "Create return delivery"
 * description: "create return delivery"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/CreateReturnDeliveryReq"
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
  const validated: CreateReturnDeliveryReq = await validator(
    CreateReturnDeliveryReq,
    req.body,
  )
  const manager = req.scope.resolve<EntityManager>('manager')
  const returnDeliveryService = req.scope.resolve<ReturnDeliveryService>(
    ReturnDeliveryService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

  if (
    !loggedInUser ||
    !loggedInUser.store_id ||
    !(loggedInUser.type === UserType.STORE_PRIME)
  ) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not store prime')
  }

  const ids = []
  await manager.transaction(async (tx) => {
    await Promise.all(
      validated.items.map(async (item) => {
        const return_delivery = await returnDeliveryService
          .withTransaction(tx)
          .create_({ ...item, store_id: loggedInUser.store_id }, loggedInUser)
        ids.push(return_delivery.id)
      }),
    )
  })

  await eventBusService.emit(ReturnDeliveryService.Events.REQUESTED, {
    id: ids,
    format: 'return-delivery-requested-shop',
  })

  res.sendStatus(201)
}

/**
 * @schema ReturnDeliveryReq
 * title: "ReturnDeliveryReq"
 * description: "Return Delivery Req"
 * x-resourceId: ReturnDeliveryReq
 * type: object
 * required:
 *   - variant_id
 *   - quantity
 * properties:
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

export class ReturnDeliveryReq {
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
}

/**
 * @schema CreateReturnDeliveryReq
 * title: "CreateReturnDeliveryReq"
 * description: "Create Return Delivery Req"
 * x-resourceId: CreateReturnDeliveryReq
 * type: object
 * required:
 *   - items
 * properties:
 *   items:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ReturnDeliveryReq"
 */

export class CreateReturnDeliveryReq {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnDeliveryReq)
  items: ReturnDeliveryReq[]
}
