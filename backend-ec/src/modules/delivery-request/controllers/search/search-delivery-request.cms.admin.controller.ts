import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import {
  DeliveryRequestAdminStatus,
  DeliveryRequestStatus,
} from '../../entities/delivery-request.entity'
import { DeliveryRequestVariant } from '../../entities/delivery-request-variant.entity'
import { DeliveryRequestSearchService } from '../../services/delivery-request-search.service'

/**
 * @oas [post] /delivery-requests/search
 * operationId: "SearchDeliveryRequests"
 * summary: "search delivery requests"
 * description: "SearchDeliveryRequests"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/SearchDeliveryRequestParams"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - DeliveryRequest
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          required:
 *            - delivery_requests
 *            - count
 *          properties:
 *             delivery_requests:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/DeliveryRequestDetailRes"
 *             count:
 *               type: integer
 *               description: The total number of items available
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

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const validated = await validator(SearchDeliveryRequestParams, req.body)

  const deliverySearchService = req.scope.resolve<DeliveryRequestSearchService>(
    DeliveryRequestSearchService.resolutionKey,
  )

  const [raw, count] = await deliverySearchService.search(validated)

  res.json({
    delivery_requests: raw,
    count,
  })
}

/**
 * @schema SearchDeliveryRequestParams
 * title: "SearchDeliveryRequestParams"
 * description: "search delivery request params"
 * x-resourceId: SearchDeliveryRequestParams
 * type: object
 * properties:
 *   admin_status:
 *     $ref: "#/components/schemas/DeliveryRequestAdminStatus"
 *   display_id:
 *     type: number
 *   released_at:
 *     type: string
 *   store_name:
 *     type: string
 *   store_id:
 *     type: number
 *   pref:
 *     type: string
 *   addr_01:
 *     type: string
 *   store_phone:
 *     type: string
 *   user_name:
 *     type: string
 *   user_id:
 *     type: number
 *   company_name:
 *     type: string
 *   limit:
 *     type: number
 *     default: 10
 *   offset:
 *     type: number
 *     default: 0
 *
 */
export class SearchDeliveryRequestParams {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  limit = 10

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset = 0

  @IsEnum(DeliveryRequestAdminStatus, {
    always: true,
    message: `Invalid value (authen type must be one of following values: ${Object.values(
      DeliveryRequestAdminStatus,
    ).join(', ')})`,
  })
  @IsOptional()
  admin_status: DeliveryRequestAdminStatus

  @IsNumber()
  @IsOptional()
  display_id: number

  @IsString()
  @IsOptional()
  released_at: string

  @IsString()
  @IsOptional()
  store_name: string

  @IsNumber()
  @IsOptional()
  store_id: number

  @IsString()
  @IsOptional()
  addr_01: string

  @IsString()
  @IsOptional()
  pref: string

  @IsString()
  @IsOptional()
  store_phone: string

  @IsString()
  @IsOptional()
  user_name: string

  @IsNumber()
  @IsOptional()
  user_id: number

  @IsString()
  @IsOptional()
  company_name: string
}

/**
 * @schema PrefectureParentStoreDetailRes
 * title: "PrefectureParentStoreDetailRes"
 * description: "Prefecture Parent Store Detail Res"
 * x-resourceId: PrefectureParentStoreDetailRes
 * type: object
 * required:
 *    - id
 *    - name
 * properties:
 *    id:
 *      type: string
 *    name:
 *      type: string
 */
export type PrefectureParentStoreDetailRes = {
  id: string
  name: string
}

/**
 * @schema PrefectureStoreDetailRes
 * title: "PrefectureStoreDetailRes"
 * description: "Prefecture Store Detail Res"
 * x-resourceId: PrefectureStoreDetailRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    name:
 *      type: string
 *    parent:
 *      $ref: "#/components/schemas/PrefectureStoreDetailRes"
 */
export type PrefectureStoreDetailRes = {
  id: string
  name: string
  parent: PrefectureParentStoreDetailRes
}

/**
 * @schema DeliveryStoreDetailRes
 * title: "DeliveryStoreDetailRes"
 * description: "Delivery Store Detail Res"
 * x-resourceId: DeliveryStoreDetailRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    prefecture_id:
 *      type: string
 *    tel_number:
 *      type: string
 *    addr_01:
 *      type: string
 */
export type DeliveryStoreDetailRes = {
  id: string
  prefecture_id: string
  tel_number: string
  addr_01: string
}

/**
 * @schema DeliveryStoreRes
 * title: "DeliveryStoreRes"
 * description: "Delivery Store Res"
 * x-resourceId: DeliveryStoreRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    name:
 *      type: string
 *    store_detail:
 *      $ref: "#/components/schemas/DeliveryStoreDetailRes"
 */
export type DeliveryStoreRes = {
  id: string
  name: string
  store_detail: DeliveryStoreDetailRes
}

/**
 * @schema DeliveryVariantsRes
 * title: "DeliveryVariantsRes"
 * description: "Delivery Variants Res"
 * x-resourceId: DeliveryVariantsRes
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
 */
export type DeliveryVariantsRes = {
  id: string
  title: string
  requests: DeliveryRequestVariant[]
}

/**
 * @schema DeliveryProductRes
 * title: "DeliveryProductRes"
 * description: "Delivery Product Res"
 * x-resourceId: DeliveryProductRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    title:
 *      type: string
 *    display_code:
 *      type: string
 *    variants:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/DeliveryVariantsRes"
 */
export type DeliveryProductRes = {
  id: string
  title: string
  display_id: number
  display_code: string
  variants: DeliveryVariantsRes[]
}

/**
 * @schema DeliveryChildrenRes
 * title: "DeliveryChildrenRes"
 * description: "Delivery Children Res"
 * x-resourceId: DeliveryChildrenRes
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
 *    product:
 *      $ref: "#/components/schemas/DeliveryProductRes"
 *    admin_status:
 *      $ref: "#/components/schemas/DeliveryRequestAdminStatus"
 */
export type DeliveryChildrenRes = {
  id: string
  created_at: Date
  display_id: number
  suggested_price: number
  total_stock: number
  product: DeliveryProductRes
  admin_status: DeliveryRequestAdminStatus
}

/**
 * @schema DeliveryRequestDetailRes
 * title: "DeliveryRequestDetailRes"
 * description: "Delivery Request Detail Res"
 * x-resourceId: DeliveryRequestDetailRes
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
 *      $ref: "#/components/schemas/DeliveryStoreRes"
 *    children:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/DeliveryChildrenRes"
 *    admin_status:
 *      $ref: "#/components/schemas/DeliveryRequestAdminStatus"
 */
export type DeliveryRequestDetailRes = {
  id: string
  created_at: Date
  display_id: string
  status: DeliveryRequestStatus
  store: DeliveryStoreRes
  children: DeliveryChildrenRes[]
  admin_status: DeliveryRequestAdminStatus
}
