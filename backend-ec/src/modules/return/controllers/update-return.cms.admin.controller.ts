import { Return, ReturnStatus, SwapService } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { isDefined, MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OrderService } from '../../order/services/order.service'
import { OriginEnum } from '../entities/return.entity'
import { ReturnService } from '../service/return.service'
import { ReturnHistoryService } from '../service/return-history.service'

/**
 * @oas [put] /return/{id}/cms
 * operationId: "updateReturnAdminCms"
 * summary: "update Return Admin Cms"
 * description: "update Return Admin Cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Return.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - items
 *         properties:
 *           items:
 *             description: The Line Items that have been received.
 *             type: array
 *             items:
 *               required:
 *                 - item_id
 *                 - quantity
 *               properties:
 *                 item_id:
 *                   description: The ID of the Line Item.
 *                   type: string
 *                 quantity:
 *                   description: The quantity of the Line Item.
 *                   type: integer
 *           status:
 *             description: "Status of the Return."
 *             type: string
 *             enum:
 *               - requested
 *               - received
 *               - requires_action
 *               - canceled
 *           reason:
 *             type: string
 *           origin:
 *             $ref: "#/components/schemas/OriginEnum"
 *           note:
 *             type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Return
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/return"
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
const updateReturnCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const id = req.params.id

  const validated = await validator(AdminPostReturnsReturnReceiveReq, req.body)

  const returnService: ReturnService = req.scope.resolve('returnService')
  const orderService: OrderService = req.scope.resolve('orderService')
  const swapService: SwapService = req.scope.resolve('swapService')
  const entityManager: EntityManager = req.scope.resolve('manager')
  const returnHistoryService: ReturnHistoryService = req.scope.resolve(
    'returnHistoryService',
  )

  await returnHistoryService.create_(loggedInUser.id, id)

  let result: Return
  if (validated.status === ReturnStatus.RECEIVED) {
    await entityManager.transaction(async (manager) => {
      result = await returnService.withTransaction(manager).retrieve(id)
      let refundAmount = (result as Return).refund_amount

      if (isDefined(refundAmount) && refundAmount < 0) {
        refundAmount = 0
      }

      await returnService.withTransaction(manager).updateCms(id, {
        reason: validated.reason,
        origin: validated.origin,
        note: validated.note,
      })

      result = await returnService
        .withTransaction(manager)
        .receive(id, validated.items, refundAmount, true)

      if (result.order_id) {
        await orderService
          .withTransaction(manager)
          .registerReturnReceived(result.order_id, result, refundAmount)
      }

      if (result.swap_id) {
        await swapService
          .withTransaction(manager)
          .registerReceived(result.swap_id)
      }
    })
  }

  if (validated.status === ReturnStatus.CANCELED) {
    result = await entityManager.transaction(async (transactionManager) => {
      await returnService.withTransaction(transactionManager).updateCms(id, {
        reason: validated.reason,
        origin: validated.origin,
        note: validated.note,
      })
      return await returnService.withTransaction(transactionManager).cancel(id)
    })
  }

  if (
    validated.status !== ReturnStatus.CANCELED &&
    validated.status !== ReturnStatus.RECEIVED
  ) {
    await returnService.updateCms(id, {
      status: validated.status,
      reason: validated.reason,
      origin: validated.origin,
      note: validated.note,
    })
  }

  result = await returnService.retrieve(id, { relations: ['swap'] })

  res.status(200).json({ return: result })
}

export default updateReturnCmsController

class Item {
  @IsString()
  item_id: string

  @IsNumber()
  quantity: number
}

export class AdminPostReturnsReturnReceiveReq {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items: Item[]

  @IsOptional()
  @IsEnum(ReturnStatus, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      ReturnStatus,
    ).join(', ')})`,
  })
  status?: ReturnStatus

  @IsString()
  @IsOptional()
  reason?: string

  @IsString()
  @IsOptional()
  note?: string

  @IsOptional()
  @IsEnum(OriginEnum, {
    always: true,
    message: `Invalid value (origin must be one of following values: ${Object.values(
      OriginEnum,
    ).join(', ')})`,
  })
  origin?: OriginEnum
}
