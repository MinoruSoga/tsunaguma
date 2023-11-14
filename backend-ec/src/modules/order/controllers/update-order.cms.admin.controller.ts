import {
  defaultStoreOrdersRelations,
  FulfillmentStatus,
} from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OrderStatusEnum } from '../../cart/controllers/get-items-store.admin.controller'
import { EventBusService } from '../../event/event-bus.service'
import CustomerService from '../../user/services/customer.service'
import { Order } from '../entity/order.entity'
import { OrderService } from '../services/order.service'
import { OrderHistoryService } from '../services/order-history.service'

/**
 * @oas [patch] /order/{id}/cms
 * operationId: "UpdateOrderForCms"
 * summary: "Update order for admin cms"
 * description: "Update order for admin cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Order.
 * requestBody:
 *   description: Body to update order
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateOrderCmsParams"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             order:
 *               $ref: "#/components/schemas/order"
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
const updateOrderCms = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params
  const config = loadConfig()

  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const validated = await validator(UpdateOrderCmsParams, req.body)
  const orderService: OrderService = req.scope.resolve('orderService')

  const orderHistoryService: OrderHistoryService = req.scope.resolve(
    'orderHistoryService',
  )

  const customerService: CustomerService = req.scope.resolve(
    'customerService',
  ) as CustomerService

  const order = await orderService.retrieve(id)

  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { metadata, ...rest } = validated
    await orderHistoryService.create_(id, loggedInUser.id)
    const metaAddress = {
      remarks: rest.remarks,
      notes: rest.notes,
    }
    await orderService.updateOrderCms(id, validated)
    await customerService
      .withTransaction(transactionManager)
      .updateAddressCms(order.shipping_address_id, {
        metadata: metaAddress,
        ...rest,
      })
  })
  const result = await orderService.retrieveDetail(id, {
    relations: defaultStoreOrdersRelations,
  })

  if (
    result.fulfillment_status === FulfillmentStatus.SHIPPED &&
    validated.status === OrderStatusEnum.SHIPPING_COMPLETED
  ) {
    const emailOrder = orderService.convertToEmailOrder(result as Order)
    await eventBusService.emit(OrderService.Events.SHIPMENT_COMPLETE, {
      id: id,
      email: emailOrder.customer.email,
      format: 'order-shipment-complete',
      no_notification: emailOrder.no_notification,
      customer_id: emailOrder.customer_id,
      data: {
        order: emailOrder,
        purchase_history_detail_link:
          config.frontendUrl.purchaseHistoryDetail(id),
        contact_link: config.frontendUrl.contact,
        purchase_review_link: config.frontendUrl.purchaseReview(id),
      },
    })
  }

  res.status(200).json({ order: result })
}

export default updateOrderCms

export class UpdateOrderCmsParams {
  @IsEnum(OrderStatusEnum, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      OrderStatusEnum,
    ).join(', ')})`,
  })
  @IsOptional()
  status?: OrderStatusEnum

  @IsString()
  @IsOptional()
  remarks?: string

  @IsString()
  @IsOptional()
  notes?: string

  @IsString()
  @IsOptional()
  first_name?: string

  @IsString()
  @IsOptional()
  last_name?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsString()
  @IsOptional()
  company?: string

  @IsString()
  @IsOptional()
  address_1?: string

  @IsString()
  @IsOptional()
  address_2?: string

  @IsString()
  @IsOptional()
  city?: string

  @IsString()
  @IsOptional()
  province?: string

  @IsBoolean()
  @IsOptional()
  is_show?: boolean

  @IsString()
  @IsOptional()
  prefecture_id?: string

  @IsString()
  @IsOptional()
  postal_code?: string
}

/**
 * @schema UpdateOrderCmsParams
 * title: "Update order cms Params"
 * description: "Update order cms Params"
 * x-resourceId: UpdateOrderCmsParams
 * properties:
 *  status:
 *    type: string
 *  display_id:
 *    type: number
 *  memo:
 *    type: string
 *  company:
 *    type: string
 *    description: Company name
 *    example: Acme
 *  first_name:
 *    type: string
 *    description: First name
 *    example: Arno
 *  last_name:
 *    type: string
 *    description: Last name
 *    example: Willms
 *  address_1:
 *    type: string
 *    description: Address line 1
 *    example: 14433 Kemmer Court
 *  address_2:
 *    type: string
 *    description: Address line 2
 *    example: Suite 369
 *  city:
 *    type: string
 *    description: City
 *    example: South Geoffreyview
 *  province:
 *    type: string
 *    description: Province
 *    example: Kentucky
 *  postal_code:
 *    type: string
 *    description: Postal Code
 *    example: 72093
 *  phone:
 *    type: string
 *    description: Phone Number
 *    example: 16128234334802
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 *  is_show:
 *    type: boolean
 *  prefecture_id:
 *    type: string
 *  notes:
 *    type: string
 *  remarks:
 *    type: string
 */
