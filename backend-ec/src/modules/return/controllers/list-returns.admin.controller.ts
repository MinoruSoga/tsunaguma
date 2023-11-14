import { ReturnStatus } from '@medusajs/medusa'
import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ReturnSearchService } from '../service/return-search.service'

/**
 * @oas [get] /list-returns
 * operationId: "ListReturns"
 * summary: "list returns."
 * description: "List returns"
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Returns
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             returns:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/ReturnRes"
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

const listReturnController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const returnService = req.scope.resolve(
    'returnSearchService',
  ) as ReturnSearchService

  const [returns, count] = await returnService.listReturns(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ returns, count })
}
export default listReturnController

export class GetReturnsbyParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}

/**
 * @schema VariantProductRes
 * title: "VariantProductRes"
 * description: "Variant Product Res"
 * x-resourceId: VariantProductRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    display_id:
 *      type: number
 *    display_code:
 *      type: string
 *    title:
 *      type: string
 */
export type VariantProductRes = {
  id?: string
  display_id?: number
  display_code?: string
  title?: string
}

/**
 * @schema ItemVariantRes
 * title: "ItemVariantRes"
 * description: "Item Variant Res"
 * x-resourceId: ItemVariantRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    title:
 *      type: string
 *    inventory_quantity:
 *      type: number
 *    product:
 *      $ref: "#/components/schemas/VariantProductRes"
 */
export type ItemVariantRes = {
  id?: string
  title?: string
  inventory_quantity?: number
  product?: VariantProductRes
}

/**
 * @schema ItemsItemRes
 * title: "ItemsItemRes"
 * description: "Items Item Res"
 * x-resourceId: ItemsItemRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    title:
 *      type: string
 *    quantity:
 *      type: number
 *    returned_quantity:
 *      type: number
 *    variant:
 *      $ref: "#/components/schemas/ItemVariantRes"
 */
export type ItemsItemRes = {
  id?: string
  title?: string
  quantity?: number
  returned_quantity?: number
  variant?: ItemVariantRes
}

/**
 * @schema ReturnItemsRes
 * title: "ReturnItemsRes"
 * description: "Return Items Res"
 * x-resourceId: ReturnItemsRes
 * type: object
 * properties:
 *    return_id:
 *      type: string
 *    item_id:
 *      type: string
 *    quantity:
 *      type: number
 *    requested_quantity:
 *      type: number
 *    received_quantity:
 *      type: number
 *    item:
 *      $ref: "#/components/schemas/ItemsItemRes"
 */
export type ReturnItemsRes = {
  return_id?: string
  item_id?: string
  quantity?: number
  requested_quantity?: number
  received_quantity?: number
  item?: ItemsItemRes
}

/**
 * @schema ReturnRes
 * title: "ReturnRes"
 * description: "Return Res"
 * x-resourceId: ReturnRes
 * type: object
 * properties:
 *    id:
 *      type: string
 *    display_id:
 *      type: number
 *    created_at:
 *      type: string
 *    status:
 *      description: "Status of the Return."
 *      type: string
 *      enum:
 *        - requested
 *        - received
 *        - requires_action
 *        - canceled
 *    received_at:
 *      type: string
 *    refund_amount:
 *      type: number
 *    items:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/ReturnItemsRes"
 */
export type ReturnRes = {
  id?: string
  display_id?: number
  created_at?: string
  status?: ReturnStatus
  received_at?: string
  refund_amount?: number
  items?: ReturnItemsRes[]
}
