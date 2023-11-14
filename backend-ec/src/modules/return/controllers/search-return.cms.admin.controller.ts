import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OriginEnum, ReturnStatus } from '../entities/return.entity'
import { ReturnSearchService } from '../service/return-search.service'

/**
 * @oas [post] /return/search
 * operationId: "SearchReturnCms"
 * summary: "Search return cms"
 * description: "Search return cms"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetListReturnCmsBody"
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
 *              type: object
 *              properties:
 *                  count:
 *                    type: integer
 *                  returns:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/ReturnCmsRes"
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
const listReturnCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const returnSearchService: ReturnSearchService = req.scope.resolve(
    'returnSearchService',
  )

  const validated = await validator(GetListReturnCmsBody, req.body)

  const [returns, count] = await returnSearchService.search(validated)

  res.status(200).json({ returns, count })
}

/**
 * @schema GetListReturnCmsBody
 * title: "Get returns cms body"
 * description: "Get returns cms body"
 * x-resourceId: GetListReturnCmsBody
 * properties:
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 *  display_id:
 *    type: number
 *  create_from:
 *    type: string
 *  create_to:
 *    type: string
 *  ship_from:
 *    type: string
 *  ship_to:
 *    type: string
 *  store_id:
 *    type: number
 *  store_name:
 *    type: string
 *  customer_id:
 *    type: number
 *  nickname:
 *    type: string
 *  status:
 *    type: string
 *    enum:
 *      - requested
 *      - received
 *      - requires_action
 *      - canceled
 *  product_code:
 *    type: string
 *  product_id:
 *    type: number
 *  item_name:
 *    type: string
 *  sku:
 *    type: string
 *  origin:
 *    $ref: "#/components/schemas/OriginEnum"
 */

export class GetListReturnCmsBody {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsNumber()
  @IsOptional()
  display_id: number

  @IsString()
  @IsOptional()
  create_from?: string

  @IsString()
  @IsOptional()
  create_to?: string

  @IsString()
  @IsOptional()
  ship_from?: string

  @IsString()
  @IsOptional()
  ship_to?: string

  @IsNumber()
  @IsOptional()
  store_id: number

  @IsString()
  @IsOptional()
  store_name: string

  @IsNumber()
  @IsOptional()
  customer_id: number

  @IsString()
  @IsOptional()
  nickname: string

  @IsEnum(ReturnStatus)
  @IsOptional()
  status: ReturnStatus

  @IsString()
  @IsOptional()
  product_code: string

  @IsNumber()
  @IsOptional()
  product_id: number

  @IsString()
  @IsOptional()
  item_name: string

  @IsString()
  @IsOptional()
  sku: string

  @IsEnum(OriginEnum)
  @IsOptional()
  origin: OriginEnum
}
export default listReturnCmsController

/**
 * @schema ReturnVariantsProductCmsRes
 * title: "Return variants product cms"
 * description: "Return variants product cms"
 * x-resourceId: ReturnVariantsProductCmsRes
 * properties:
 *  id:
 *    type: string
 *  display_id:
 *    type: number
 *  title:
 *    type: string
 */

export type ReturnVariantsProductCmsRes = {
  id?: string
  title?: string
  display_id?: number
}

/**
 * @schema ReturnItemVariantsCmsRes
 * title: "Return item variants cms res"
 * description: "Return item variants cms res"
 * x-resourceId: ReturnItemVariantsCmsRes
 * properties:
 *  id:
 *    type: string
 *  display_id:
 *    type: number
 *  title:
 *    type: string
 *  sku:
 *    type: string
 *  inventory_quantity:
 *    type: number
 *  product:
 *    $ref: "#/components/schemas/ReturnVariantsProductCmsRes"
 */

export type ReturnItemVariantsCmsRes = {
  id?: string
  title?: string
  sku?: string
  inventory_quantity?: number
  product?: ReturnVariantsProductCmsRes
}

/**
 * @schema ReturnItemCmsRes
 * title: "Return item cms res"
 * description: "Return item cms res"
 * x-resourceId: ReturnItemCmsRes
 * properties:
 *  id:
 *    type: string
 *  title:
 *    type: string
 *  variant:
 *    $ref: "#/components/schemas/ReturnItemVariantsCmsRes"
 */

export type ReturnItemCmsRes = {
  id?: string
  title?: string
  variant: ReturnItemVariantsCmsRes
  quantity?: number
}

/**
 * @schema ReturnItemsCmsRes
 * title: "Return items cms res"
 * description: "Return items cms res"
 * x-resourceId: ReturnItemsCmsRes
 * properties:
 *   return_id:
 *     type: string
 *   item_id:
 *     type: string
 *   item:
 *     $ref: "#/components/schemas/ReturnItemCmsRes"
 *   quantity:
 *     type: number
 *   is_requested:
 *     type: boolean
 *   requested_quantity:
 *     type: number
 *   recieved_quantity:
 *     type: number
 *   reason_id:
 *     type: string
 *   note:
 *     type: string
 *   metadata:
 *     type: object
 */

export type ReturnItemsCmsRes = {
  return_id?: string
  item_id?: string
  item?: ReturnItemCmsRes
  quantity?: number
  is_requested?: boolean
  requested_quantity?: number
  received_quantity?: number
  reason_id?: string
  note?: string
  metadata?: Record<string, unknown>
}

/**
 * @schema ReturnStoreCmsRes
 * title: "Return order store cms res"
 * description: "Return order store cms res"
 * x-resourceId: ReturnStoreCmsRes
 * properties:
 *  id:
 *    type: string
 *  name:
 *    type: string
 *  display_id:
 *    type: number
 */

export type ReturnStoreCmsRes = {
  id?: string
  name?: string
  display_id?: number
}

/**
 * @schema ReturnOrderCmsRes
 * title: "Return order cms res"
 * description: "Return order cms res"
 * x-resourceId: ReturnOrderCmsRes
 * properties:
 *  id:
 *    type: string
 *  created_at:
 *    type: string
 *  display_id:
 *    type: number
 *  store:
 *    $ref: "#/components/schemas/ReturnStoreCmsRes"
 */

export type ReturnOrderCmsRes = {
  id?: string
  display_id?: number
  created_at?: Date
  store?: ReturnStoreCmsRes
}

/**
 * @schema ReturnCmsRes
 * title: "Return cms res"
 * description: "Return cms res"
 * x-resourceId: ReturnCmsRes
 * properties:
 *  id:
 *    type: string
 *  created_at:
 *    type: string
 *  display_id:
 *    type: number
 *  status:
 *    description: "Status of the Return."
 *    type: string
 *    enum:
 *      - requested
 *      - received
 *      - requires_action
 *      - canceled
 *  items:
 *    type: array
 *    items:
 *      $ref: "#/components/schemas/ReturnItemsCmsRes"
 *  order:
 *    $ref: "#/components/schemas/ReturnOrderCmsRes"
 *  is_pause:
 *    type: boolean
 *  origin:
 *    $ref: "#/components/schemas/OriginEnum"
 */

export type ReturnCmsRes = {
  id?: string
  display_id?: number
  created_at?: string
  status?: ReturnStatus
  items?: ReturnItemsCmsRes[]
  order?: ReturnOrderCmsRes
  is_pause?: boolean
  origin?: OriginEnum
}
