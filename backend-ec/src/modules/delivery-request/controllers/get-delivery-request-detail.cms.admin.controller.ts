import { ProductOptionValue, ProductTag } from '@medusajs/medusa/dist/models'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ProductColors } from '../../product/entity/product-colors.entity'
import { ProductMaterial } from '../../product/entity/product-material.entity'
import { ProductSpecs } from '../../product/entity/product-specs.entity'
import {
  DeliveryRequest,
  DeliveryRequestStatus,
} from '../entities/delivery-request.entity'
import { DeliveryRequestVariant } from '../entities/delivery-request-variant.entity'
import DeliveryRequestService from '../services/delivery-request.service'

export const defaultDeliveryRequestDetailRelations = [
  'store',
  'store.store_detail',
  'store.customer',
  'children',
  'children.product',
  'children.product.variants',
  'children.product.variants.requests',
  'children.product.variants.options',
  'children.product.product_specs',
  'children.product.product_colors',
  'children.product.tags',
  'children.product.product_material',
]

/**
 * @oas [get] /delivery-request/{id}/cms
 * operationId: "GetDeliveryRequestDetailCms"
 * summary: "Get delivery request"
 * description: "Retrieves a delivery request."
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

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const deliveryRequestService = req.scope.resolve<DeliveryRequestService>(
    DeliveryRequestService.resolutionKey,
  )

  const validated = await validator(DeliveryRequestParams, req.query)
  const { expands, fields } = validated

  const config: FindConfig<DeliveryRequest> = {}

  if (!_.isNil(fields) && fields !== '') {
    config.select = fields.split(',') as (keyof DeliveryRequest)[]
  }

  if (!_.isNil(expands) && expands !== '') {
    config.relations = [
      ...defaultDeliveryRequestDetailRelations,
      ...expands.split(','),
      ,
    ]
  } else {
    config.relations = defaultDeliveryRequestDetailRelations
  }

  const deliveryRequest = await deliveryRequestService.retrieve(
    {
      id: req.params.id,
    },
    config,
  )
  const result = await deliveryRequestService.convertDeliveryRequest(
    deliveryRequest,
  )

  result.children.sort((a, b) => a.display_id - b.display_id)

  res.status(200).json(result)
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
 * @schema DeliveryReqStoreDetailRes
 * title: "DeliveryReqStoreDetailRes"
 * description: "Delivery Store Detail Res"
 * x-resourceId: DeliveryReqStoreDetailRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    company_name:
 *      type: string
 */
export type DeliveryReqStoreDetailRes = {
  id: string
  company_name: string
}

/**
 * @schema DeliveryReqCustomerRes
 * title: "DeliveryReqCustomerRes"
 * description: "Delivery Store Customer Res"
 * x-resourceId: DeliveryReqCustomerRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    nickname:
 *      type: string
 *    display_id:
 *      type: number
 */
export type DeliveryReqCustomerRes = {
  id: string
  nickname: string
  display_id: number
}

/**
 * @schema DeliveryReqStoreRes
 * title: "DeliveryReqStoreRes"
 * description: "Delivery Request Store Res"
 * x-resourceId: DeliveryReqStoreRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    name:
 *      type: string
 *    display_id:
 *      type: number
 *    store_detail:
 *      $ref: "#/components/schemas/DeliveryStoreDetailRes"
 *    customer:
 *      $ref: "#/components/schemas/DeliveryReqCustomerRes"
 */
export type DeliveryReqStoreRes = {
  id: string
  name: string
  display_id: number
  store_detail: DeliveryReqStoreDetailRes
  customer: DeliveryReqCustomerRes
}

/**
 * @schema DeliveryReqVariantsRes
 * title: "DeliveryReqVariantsRes"
 * description: "Delivery Variants Res"
 * x-resourceId: DeliveryReqVariantsRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    title:
 *      type: string
 *    requests:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/delivery_request_variant"
 *    options:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/product_option_value"
 *    threshold_quantity:
 *      type: number
 *    restocking_responsive:
 *      type: boolean
 *
 */
export type DeliveryReqVariantsRes = {
  id: string
  title: string
  requests: DeliveryRequestVariant[]
  options: ProductOptionValue[]
  threshold_quantity: number
  restocking_responsive: boolean
}

/**
 * @schema DeliveryReqProductRes
 * title: "DeliveryReqProductRes"
 * description: "Delivery Product Res"
 * x-resourceId: DeliveryReqProductRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    title:
 *      type: string
 *    display_code:
 *      type: string
 *    display_id:
 *      type: string
 *    variants:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/DeliveryReqVariantsRes"
 *    tags:
 *      description: The Product Tags assigned to the Product. Available if the relation `tags` is expanded.
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/product_tag"
 *    product_material:
 *      description: Available if the relation `material_id` is expanded.
 *      $ref: "#/components/schemas/product_material"
 *    product_specs:
 *      description: The Product Specs assigned to the Product. Available if the relation `product_specs` is expanded.
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/product_specs"
 *    product_colors:
 *      description: The Colors assigned to the Product. Available if the relation `product_colors` is expanded.
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/product_colors"
 *    type_lv2_id:
 *      type: string
 *    type_lv1_id:
 *      type: string
 *    type_id:
 *      type: string
 *    description:
 *      type: string
 *    material_id:
 *      type: string
 */
export type DeliveryReqProductRes = {
  id: string
  title: string
  description: string
  display_id: number
  display_code: string
  material_id: string
  type_id: string
  type_lv1_id: string
  type_lv2_id: string
  tags: ProductTag[]
  product_colors: ProductColors[]
  product_specs: ProductSpecs[]
  product_material: ProductMaterial
  variants: DeliveryReqVariantsRes[]
}

/**
 * @schema DeliveryReqChildrenRes
 * title: "DeliveryReqChildrenRes"
 * description: "Delivery Children Res"
 * x-resourceId: DeliveryReqChildrenRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    created_at:
 *      type: string
 *    display_id:
 *      type: number
 *    suggested_price:
 *      type: number
 *    total_stock:
 *      type: number
 *    background_type:
 *      type: number
 *    redelivery_flag:
 *      type: boolean
 *    shooting:
 *      type: number
 *    product:
 *      $ref: "#/components/schemas/DeliveryReqProductRes"
 *    status:
 *      $ref: "#/components/schemas/DeliveryRequestStatus"
 */
export type DeliveryReqChildrenRes = {
  id: string
  created_at: Date
  display_id: number
  suggested_price: number
  total_stock: number
  background_type: number
  product: DeliveryReqProductRes
  redelivery_flag: boolean
  shooting: number
  status: DeliveryRequestStatus
}

/**
 * @schema DeliveryReqDetailRes
 * title: "DeliveryReqDetailRes"
 * description: "Delivery Request Detail Res"
 * x-resourceId: DeliveryReqDetailRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    created_at:
 *      type: string
 *    display_id:
 *      type: number
 *    status:
 *      $ref: "#/components/schemas/DeliveryRequestStatus"
 *    store:
 *      $ref: "#/components/schemas/DeliveryReqStoreRes"
 *    children:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/DeliveryReqChildrenRes"
 */
export type DeliveryReqDetailRes = {
  id: string
  created_at: Date
  display_id: string
  status: DeliveryRequestStatus
  store: DeliveryReqStoreRes
  children: DeliveryReqChildrenRes[]
}
