import { AdminPostProductsReq } from '@medusajs/medusa'
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
import {
  DeliveryRequestAdminStatus,
  DeliveryRequestStatus,
} from '../entities/delivery-request.entity'
import DeliveryRequestService from '../services/delivery-request.service'
import { DeliveryRequestHistoryService } from '../services/delivery-request-history.service'
import {
  DeliveryProductSpecsReq,
  DeliveryProductVariantsReq,
} from './created-delivery-request.admin.controller'

/**
 * @oas [put] /delivery-request/{id}
 * operationId: "updateDeliveryRequest"
 * summary: "update delivery request"
 * description: "update delivery request"
 * parameters:
 *   - (path) id=* {string} The ID of the Delivery Request.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/PutDeliveryRequestBody"
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

// *** CAUTION ***
// only for draft

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

  const manager = req.scope.resolve('manager') as EntityManager

  const validated: PutDeliveryRequestBody = await validator(
    PutDeliveryRequestBody,
    req.body,
  )
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )

  const deliveryRequestHistoryService =
    req.scope.resolve<DeliveryRequestHistoryService>(
      DeliveryRequestHistoryService.resolutionKey,
    )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const isUserAdmin = isAdmin(loggedInUser)

  // check if user exist and have a store
  if (
    !isUserAdmin &&
    (!isStorePrime(loggedInUser) ||
      !loggedInUser?.store_id ||
      !isActive(loggedInUser))
  ) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  const parentId = req.params.id

  if (isUserAdmin) {
    await deliveryRequestHistoryService.create_(loggedInUser.id, parentId, true)
  }

  const raw = await deliveryRequestService.retrieve(
    { id: parentId },
    {
      select: ['id'],
      relations: ['children'],
    },
  )

  const hasQuantityConfirmOld = raw.children.filter(
    (e) => e.admin_status === DeliveryRequestAdminStatus.QUANTITY_CONFIRM,
  ).length

  const hasArrivedOld = raw.children.filter(
    (e) => e.admin_status === DeliveryRequestAdminStatus.ARRIVED,
  ).length

  // update note
  await deliveryRequestService.saveNote(parentId, validated.note)

  if (!isUserAdmin) {
    for (const chil of raw.children) {
      const exists = validated.items.find((v) => v.id && chil.id === v.id)
      if (!exists) {
        await deliveryRequestService.delete(chil.id, false)
      }
    }
  }

  await manager.transaction(async (tx) => {
    for (let i = 0; i < validated.items.length; i++) {
      const item = validated.items[i]
      if (item.id) {
        const old = await deliveryRequestService.retrieve({
          id: item.id,
        })

        if (old.status !== DeliveryRequestStatus.DELIVERED) {
          await deliveryRequestService.withTransaction(tx).update(item.id, {
            ...item,
            user_id: loggedInUser.id,
            rank: i + 1,
          })
        }

        if (
          item.admin_status === DeliveryRequestAdminStatus.ARRIVED &&
          old.admin_status !== DeliveryRequestAdminStatus.ARRIVED
        ) {
          await deliveryRequestService.withTransaction(tx).addInventory(item.id)
        }
      } else {
        const storeId = isUserAdmin ? item.store_id : loggedInUser.store_id

        await deliveryRequestService
          .withTransaction(tx)
          .create_(
            { ...item, user_id: loggedInUser.id, rank: i + 1 },
            storeId,
            parentId,
          )
      }
    }
  })

  await eventBusService.emit(DeliveryRequestService.Events.UPDATE, {
    id: parentId,
  })

  const data = await deliveryRequestService.retrieve(
    { id: parentId },
    { relations: ['children'] },
  )

  if (!isUserAdmin) {
    if (data.status === DeliveryRequestStatus.PENDING) {
      await eventBusService.emit(DeliveryRequestService.Events.SEND_MAIL, {
        id: data.id,
        format: 'delivery-request-shop',
        is_parent: true,
      })
    }
  } else {
    const hasQuantityConfirm = data.children.filter(
      (e) => e.admin_status === DeliveryRequestAdminStatus.QUANTITY_CONFIRM,
    ).length

    if (hasQuantityConfirm > 0 && hasQuantityConfirm > hasQuantityConfirmOld) {
      await eventBusService.emit(
        DeliveryRequestService.Events.QUANTITY_CONFIRM,
        {
          id: data.id,
          format: 'delivery-request-confirm-quantity',
          is_parent: true,
        },
      )
    }

    const hasArrived = data.children.filter(
      (e) => e.admin_status === DeliveryRequestAdminStatus.ARRIVED,
    ).length

    if (hasArrived > 0 && hasArrived > hasArrivedOld) {
      await eventBusService.emit(DeliveryRequestService.Events.ARRIVED, {
        id: data.id,
        format: 'delivery-request-arrived',
        is_parent: true,
      })
    }
  }

  res.status(200).json(data)
}

/**
 * @schema PutProductRequestReq
 * title: "PutProductRequestReq"
 * description: "Products are a grouping of Product Variants that have common properties such as images and descriptions. Products can have multiple options which define the properties that Product Variants differ by."
 * x-resourceId: PutProductRequestReq
 * type: object
 * properties:
 *   store_id:
 *     description: "Prime Store ID"
 *     type: string
 *   display_code:
 *     description: "Display code of product"
 *     type: string
 *   title:
 *     description: "A title that can be displayed for easy identification of the Product."
 *     type: string
 *     example: Medusa Coffee Mug
 *   description:
 *     description: "A short description of the Product."
 *     type: string
 *     example: Every programmer's best friend.
 *   status:
 *     $ref: "#/components/schemas/ProductStatusEnum"
 *     default: draft
 *   variants:
 *     description: The Product Variants that belong to the Product. Each will have a unique combination of Product Option Values.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/DeliveryProductVariantsReq"
 *   type_id:
 *     type: string
 *     description: The Product type that the Product belongs to
 *     example: ptyp_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   tags:
 *     description: The Product Tags assigned to the Product.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedAdminPostProductTagsReq"
 *   material_id:
 *     type: string
 *     description: The id of the material that the Product belongs to
 *     example: material_02G8X9A7ESKAJXG2H0E6F2MW7A
 *   product_specs:
 *     description: The Product Specs assigned to the Product.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/DeliveryProductSpecsReq"
 *   product_colors:
 *     description: The Colors assigned to the Product.
 *     type: array
 *     items:
 *       type: string
 */
export class PutProductRequestReq extends AdminPostProductsReq {
  @IsString()
  @IsOptional()
  display_code?: string

  @IsString()
  @IsOptional()
  title: string

  @IsString()
  @IsOptional()
  store_id?: string

  @IsString()
  @IsOptional()
  type_id?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  material_id?: string

  @IsString({ each: true })
  @IsOptional()
  product_colors?: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => DeliveryProductSpecsReq)
  product_specs?: DeliveryProductSpecsReq[]

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DeliveryProductVariantsReq)
  variants?: DeliveryProductVariantsReq[]
}

/**
 * @schema PutDeliveryRequestReq
 * title: "PutDeliveryRequestReq"
 * description: "Put delivery request Req"
 * x-resourceId: PutDeliveryRequestReq
 * type: object
 * properties:
 *   id:
 *     type: string
 *   suggested_price:
 *     type: number
 *   product:
 *     $ref: "#/components/schemas/PutProductRequestReq"
 *   shooting:
 *     type: number
 *   background_type:
 *     type: number
 *   metadata:
 *     type: object
 *   status:
 *     $ref: "#/components/schemas/DeliveryRequestStatus"
 *   redelivery_flag:
 *     type: boolean
 *   admin_status:
 *     $ref: "#/components/schemas/DeliveryRequestAdminStatus"
 *   store_id:
 *     type: string
 */

export class PutDeliveryRequestReq {
  @IsString()
  @IsOptional()
  id: string

  @IsNumber()
  @IsOptional()
  suggested_price: number

  @IsString()
  @IsOptional()
  store_id?: string

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => PutProductRequestReq)
  @IsOptional()
  product: PutProductRequestReq

  @IsEnum(DeliveryRequestStatus, {
    always: true,
    message: `Invalid value (authen type must be one of following values: ${Object.values(
      DeliveryRequestStatus,
    ).join(', ')})`,
  })
  @IsOptional()
  status: DeliveryRequestStatus

  @IsNumber()
  @IsOptional()
  shooting: number

  @IsNumber()
  @IsOptional()
  background_type: number

  @IsBoolean()
  @IsOptional()
  redelivery_flag: boolean

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsOptional()
  @IsEnum(DeliveryRequestAdminStatus, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      DeliveryRequestAdminStatus,
    ).join(', ')})`,
  })
  admin_status?: DeliveryRequestAdminStatus
}

/**
 * @schema PutDeliveryRequestBody
 * title: "PutDeliveryRequestBody"
 * description: "Put delivery request Body"
 * x-resourceId: PutDeliveryRequestBody
 * type: object
 * required:
 *   - items
 * properties:
 *   items:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/PutDeliveryRequestReq"
 *   note:
 *     type: string
 */

export class PutDeliveryRequestBody {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PutDeliveryRequestReq)
  items: PutDeliveryRequestReq[]

  @IsString()
  @IsOptional()
  note?: string
}
