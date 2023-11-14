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
import { isAdmin } from '../../../modules/user/constant'
import {
  ReturnDeliveryOriginEnum,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'
import { ReturnDeliveryService } from '../service/return-delivery.service'
import { ReturnDeliveryHistoryService } from '../service/return-delivery-history.service'

/**
 * @oas [put] /return-delivery/{id}
 * operationId: "UpdateReturnDeliveryAdminCms"
 * summary: "Update Return Delivery Admin Cms"
 * description: "Update Return Delivery Admin Cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Return Delivery.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/UpdateReturnDeliveryCmsReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ReturnDelivery
 * responses:
 *   "200":
 *      description: OK
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
 *
 */
const updateReturnDeliveryCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const returnDeliveryHistoryService: ReturnDeliveryHistoryService =
    req.scope.resolve('returnDeliveryHistoryService')
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const entityManager: EntityManager = req.scope.resolve('manager')
  const id = req.params.id
  const validated: UpdateReturnDeliveryCmsReq = await validator(
    UpdateReturnDeliveryCmsReq,
    req.body,
  )
  const returnDeliveryService: ReturnDeliveryService = req.scope.resolve(
    'returnDeliveryService',
  )

  await entityManager.transaction(async (manager) => {
    await returnDeliveryHistoryService
      .withTransaction(manager)
      .create_(loggedInUser.id, id)

    await returnDeliveryService
      .withTransaction(manager)
      .update_(id, validated, loggedInUser)
  })

  res.sendStatus(200)
}

export default updateReturnDeliveryCmsController

/**
 * @schema UpdateReturnDeliveryCmsReq
 * title: "UpdateReturnDeliveryCmsReq"
 * description: "Update Return Delivery Cms Req"
 * x-resourceId: UpdateReturnDeliveryCmsReq
 * type: object
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

export class UpdateReturnDeliveryCmsReq {
  @IsString()
  @IsOptional()
  variant_id?: string

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
  @IsOptional()
  quantity?: number

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
  @IsOptional()
  store_id?: string
}
