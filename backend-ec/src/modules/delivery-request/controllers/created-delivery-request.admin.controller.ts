import {
  AdminPostProductsProductVariantsReq,
  AdminPostProductsReq,
} from '@medusajs/medusa'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
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
import { ExtendedProductVariantPricesCreateReq } from '../../product/controllers/create-product.admin.controller'
import { isActive, isAdmin, isStorePrime } from '../../user/constant'
import { DeliveryRequestStatus } from '../entities/delivery-request.entity'
import DeliveryRequestService from '../services/delivery-request.service'

/**
 * @oas [post] /delivery-request
 * operationId: "AddDeliveryRequest"
 * summary: "add delivery request"
 * description: "add delivery request"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/CreateDeliveryRequestReq"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - DeliveryRequest
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
  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

  const validated: CreateDeliveryRequestReq = await validator(
    CreateDeliveryRequestReq,
    req.body,
  )
  const manager = req.scope.resolve<EntityManager>('manager')
  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const isUserAdmin = isAdmin(loggedInUser)

  if (isUserAdmin && validated.items.some((item) => !item.store_id)) {
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
  if (new Set(validated.items.map((i) => i.store_id)).size !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Can create delivery request of only one store',
    )
  } else if (new Set(validated.items.map((i) => i.status)).size !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Can create delivery request of only one status',
    )
  } else if (
    !isUserAdmin &&
    ![DeliveryRequestStatus.DRAFT, DeliveryRequestStatus.PENDING].includes(
      validated.items[0].status,
    )
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Can create delivery request of only 'pending' or 'draft' status",
    )
  }

  // pass all validations => allow to create delivery request

  const result = await manager.transaction(async (tx) => {
    const storeId = isUserAdmin
      ? validated.items[0].store_id
      : loggedInUser.store_id
    // create parent
    const parent = await deliveryRequestService
      .withTransaction(tx)
      .create({ status: validated.items[0].status }, storeId)

    // create mutiple delivery requests
    const children = await Promise.all(
      validated.items.map(async (item, idx) => {
        return await deliveryRequestService
          .withTransaction(tx)
          .create(
            { ...item, user_id: loggedInUser.id, rank: idx + 1 },
            storeId,
            parent.id,
          )
      }),
    )

    parent.children = children

    if (parent.status === DeliveryRequestStatus.PENDING) {
      await eventBusService
        .withTransaction(tx)
        .emit(DeliveryRequestService.Events.SEND_MAIL, {
          id: parent.id,
          format: 'delivery-request-shop',
          is_parent: true,
        })
    }

    return parent
  })

  res.status(201).json(result)
}

/**
 * @schema DeliveryProductVariantsReq
 * title: "DeliveryProductVariantsReq"
 * description: "Group of specs for product"
 * x-resourceId: DeliveryProductVariantsReq
 * type: object
 * required:
 *   - inventory_quantity
 * properties:
 *   id:
 *     description: "The ID of variant"
 *     type: string
 *   variant_rank:
 *     description: "Display order of variant ( from 0 )"
 *     type: number
 *   product_id:
 *     description: "The id of product"
 *     type: string
 *   inventory_quantity:
 *     description: "Inventory Quantity"
 *     type: integer
 *     example: 10
 *   manage_inventory:
 *     description: "false: make after order, true: use inventory_quantity"
 *     type: boolean
 *     example: false
 *   different_quantity_flag:
 *     description: "check when product quantity received different"
 *     type: boolean
 *     example: false
 *   different_quantity:
 *     description: "num of product quantity received"
 *     type: integer
 *     example: 10
 *   color:
 *     description: "color"
 *     type: string
 *     example: Black
 *   size:
 *     description: "Size"
 *     type: string
 *     example: S
 *   prices:
 *     description: List of prices for variant
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedProductVariantPricesCreateReq"
 *   restocking_responsive:
 *     type: boolean
 *   threshold_quantity:
 *     type: number
 */
export class DeliveryProductVariantsReq extends AdminPostProductsProductVariantsReq {
  @IsString()
  @IsOptional()
  id?: string

  @IsInt()
  @IsOptional()
  variant_rank?: number

  @IsString()
  @IsOptional()
  product_id?: string

  @IsString()
  @IsOptional()
  title = ''

  @IsInt()
  inventory_quantity: number

  @IsBoolean()
  @IsOptional()
  manage_inventory: boolean

  @IsBoolean()
  @IsOptional()
  different_quantity_flag: boolean

  @IsNumber()
  @IsOptional()
  different_quantity: number

  @IsString()
  @IsOptional()
  color?: string

  @IsString()
  @IsOptional()
  size?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtendedProductVariantPricesCreateReq)
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateIf((_, val) => !!val)
  prices: ExtendedProductVariantPricesCreateReq[]

  @IsBoolean()
  @IsOptional()
  restocking_responsive?: boolean

  @IsOptional()
  @IsNumber()
  threshold_quantity?: number
}

/**
 * @schema PostProductRequestReq
 * title: "PostProductRequestReq"
 * description: "Products are a grouping of Product Variants that have common properties such as images and descriptions. Products can have multiple options which define the properties that Product Variants differ by."
 * x-resourceId: PostProductRequestReq
 * type: object
 * required:
 *   - title
 * properties:
 *   store_id:
 *     description: "Prime Store ID"
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
export class PostProductRequestReq extends AdminPostProductsReq {
  @IsString()
  title: string

  @IsString()
  @IsOptional()
  store_id?: string

  @IsString()
  @IsOptional()
  type_id?: string

  @IsString()
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
 * @schema DeliveryProductSpecsReq
 * title: "DeliveryProductSpecsReq"
 * description: "Group of specs for product"
 * x-resourceId: DeliveryProductSpecsReq
 * type: object
 * properties:
 *   lv1_id:
 *     description: "項目ID"
 *     type: string
 *   lv2_id:
 *     description: "種類ID"
 *     type: string
 *   lv2_content:
 *     description: "種類名"
 *     type: string
 *   lv3_id:
 *     description: "詳細ID"
 *     type: string
 *   lv3_content:
 *     description: "詳細名"
 *     type: string
 */
export class DeliveryProductSpecsReq {
  @IsString()
  lv1_id: string

  @IsString()
  @IsOptional()
  lv2_id?: string

  @IsString()
  @IsOptional()
  lv2_content?: string

  @IsString()
  @IsOptional()
  lv3_id?: string

  @IsString()
  @IsOptional()
  lv3_content?: string
}

/**
 * @schema PostDeliveryRequestReq
 * title: "PostDeliveryRequestReq"
 * description: "Post delivery request Req"
 * x-resourceId: PostDeliveryRequestReq
 * type: object
 * required:
 *   - status
 *   - product
 *   - shooting
 * properties:
 *   suggested_price:
 *     type: number
 *   status:
 *     $ref: "#/components/schemas/DeliveryRequestStatus"
 *   product:
 *     $ref: "#/components/schemas/PostProductRequestReq"
 *   shooting:
 *     type: number
 *   background_type:
 *     type: number
 *   metadata:
 *     type: object
 *   store_id:
 *     type: string
 */

export class PostDeliveryRequestReq {
  @IsString()
  @IsOptional()
  store_id?: string

  @IsNumber()
  @ValidateIf((o) => o.status !== DeliveryRequestStatus.DRAFT)
  suggested_price: number

  @IsEnum(DeliveryRequestStatus, {
    always: true,
    message: `Invalid value (authen type must be one of following values: ${Object.values(
      DeliveryRequestStatus,
    ).join(', ')})`,
  })
  status: DeliveryRequestStatus

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => PostProductRequestReq)
  @ValidateIf((o) => o.status !== DeliveryRequestStatus.DRAFT)
  product: PostProductRequestReq

  @IsNumber()
  @ValidateIf((o) => o.status !== DeliveryRequestStatus.DRAFT)
  shooting: number

  @IsNumber()
  @IsOptional()
  background_type: number

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}

/**
 * @schema CreateDeliveryRequestReq
 * title: "CreateDeliveryRequestReq"
 * description: "Post delivery request Req"
 * x-resourceId: CreateDeliveryRequestReq
 * type: object
 * required:
 *   - items
 * properties:
 *   items:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/PostDeliveryRequestReq"
 */

export class CreateDeliveryRequestReq {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PostDeliveryRequestReq)
  items: PostDeliveryRequestReq[]
}
