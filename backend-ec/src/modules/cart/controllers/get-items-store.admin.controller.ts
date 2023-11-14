import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { LineItemService } from '../services/line-item.service'

/**
 * @schema OrderStatusEnum
 * title: "OrderStatusEnum"
 * description: "The list of status of the Order"
 * x-resourceId: OrderStatusEnum
 * type: string
 * enum:
 *   - new_order
 *   - preparing_to_ship
 *   - shipping_completed
 *   - transaction_completed
 *   - cancel
 *   - returns
 *   - cancel_request
 */

export enum OrderStatusEnum {
  ALL = 'all',
  NEW_ORDER = 'new_order',
  PREPARING_TO_SHIP = 'preparing_to_ship',
  SHIPPING_COMPLETED = 'shipping_completed',
  TRANSACTION_COMPLETED = 'transaction_completed',
  CANCEL_REQUEST = 'cancel_request',
  CANCEL = 'cancel',
  RETURNS = 'returns',
}
/**
 * @oas [get] /list-items
 * operationId: GetListItemsByStore
 * summary: Get list items by store
 * parameters:
 *   - (query) search {string}  The conditions for search in list items.
 *   - (query) fields {string} (Comma separated) Which fields should be included in each items of the result.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of items
 *   - (query) order {string} The order of items
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each items of the result.
 *   - in: query
 *     name: status
 *     required: false
 *     schema:
 *       $ref: "#/components/schemas/OrderStatusEnum"
 * tags:
 *   - LineItem
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/line_item"
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
const listItemsByStore = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const lineItemService: LineItemService = req.scope.resolve('lineItemService')
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  if (!loggedInUser?.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'not a store')
  }
  const [items, count] = await lineItemService.getListItemsByStore(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ items, count })
}
export default listItemsByStore

export class GetListItemsbyStoreParams {
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
  fields?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  expand?: string

  @IsString()
  @IsOptional()
  search?: string
}
