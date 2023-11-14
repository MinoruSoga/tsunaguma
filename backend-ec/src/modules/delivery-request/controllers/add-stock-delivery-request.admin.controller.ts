import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { EventBusService } from '../../event/event-bus.service'
import { isActive, isAdmin, isStorePrime } from '../../user/constant'
import { DeliveryRequestStatus } from '../entities/delivery-request.entity'
import DeliveryRequestService from '../services/delivery-request.service'
import { DeliveryProductVariantsReq } from './created-delivery-request.admin.controller'

/**
 * @oas [post] /delivery-request/add-stock
 * operationId: "AddDeliveryStockReq"
 * summary: "add stock delivery request"
 * description: "add stock delivery request"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/AddDeliveryStockReq"
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
  const validated: AddDeliveryStockReq = await validator(
    AddDeliveryStockReq,
    req.body,
  )
  const manager = req.scope.resolve<EntityManager>('manager')

  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const isUserAdmin = isAdmin(loggedInUser)

  if (isUserAdmin && !validated.store_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Store is required')
  } else if (
    !loggedInUser?.id ||
    !loggedInUser.store_id ||
    !isStorePrime(loggedInUser) ||
    !isActive(loggedInUser)
  ) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  // validate belongs to one store and have same status
  if (
    !isUserAdmin &&
    ![DeliveryRequestStatus.DRAFT, DeliveryRequestStatus.PENDING].includes(
      validated.status,
    )
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Can create delivery request of only 'pending' or 'draft' status",
    )
  }

  // pass all validations => allow to create delivery request

  const result = await manager.transaction(async (tx) => {
    const storeId = isUserAdmin ? validated.store_id : loggedInUser.store_id

    validated.store_id = storeId
    // create parent
    const parent = await deliveryRequestService
      .withTransaction(tx)
      .create({ status: validated.status }, storeId)

    // create mutiple delivery requests
    const newDeliveryRequest = await deliveryRequestService
      .withTransaction(tx)
      .addStock(validated, parent.id)

    parent.children = [newDeliveryRequest]

    if (!isUserAdmin) {
      if (validated.status === DeliveryRequestStatus.PENDING) {
        await eventBusService
          .withTransaction(tx)
          .emit(DeliveryRequestService.Events.SEND_MAIL, {
            id: parent.id,
            format: 'delivery-request-shop',
            is_parent: true,
          })
      }
    }

    return parent
  })

  res.status(201).json(result)
}

/**
 * @schema AddStockProductReq
 * title: "AddStockProductReq"
 * description: "Products are a grouping of Product Variants that have common properties such as images and descriptions. Products can have multiple options which define the properties that Product Variants differ by."
 * x-resourceId: AddStockProductReq
 * type: object
 * required:
 *   - id
 * properties:
 *   id:
 *     type: string
 *   variants:
 *     description: The Product Variants that belong to the Product. Each will have a unique combination of Product Option Values.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/DeliveryProductVariantsReq"
 */
export class AddStockProductReq {
  @IsString()
  id: string

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DeliveryProductVariantsReq)
  variants: DeliveryProductVariantsReq[]
}

/**
 * @schema AddDeliveryStockReq
 * title: "AddDeliveryStockReq"
 * description: "Add or create new delivery request stock params"
 * x-resourceId: AddDeliveryStockReq
 * type: object
 * required:
 *   - status
 *   - product
 * properties:
 *   status:
 *     $ref: "#/components/schemas/DeliveryRequestStatus"
 *   product:
 *     $ref: "#/components/schemas/AddStockProductReq"
 *   store_id:
 *     type: string
 */

export class AddDeliveryStockReq {
  @IsString()
  @IsOptional()
  store_id?: string

  @IsEnum(DeliveryRequestStatus, {
    always: true,
    message: `Invalid value (delivery statsu must be one of following values: ${Object.values(
      DeliveryRequestStatus,
    ).join(', ')})`,
  })
  status: DeliveryRequestStatus

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => AddStockProductReq)
  @ValidateIf((o) => o.status !== DeliveryRequestStatus.DRAFT)
  product: AddStockProductReq
}
