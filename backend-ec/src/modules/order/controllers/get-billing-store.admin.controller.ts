import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { OrderService } from '../services/order.service'

/**
 * @oas [get] /billing-store
 * operationId: GetBillingByStore
 * summary: Get billing by store
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of items
 *   - (query) store_id {string} The id of store
 * tags:
 *   - Order
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             result:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: total
 *                 subtotal:
 *                   type: integer
 *                   description: subtotal
 *                 shipping_total:
 *                   type: integer
 *                   description: total shipping
 *                 discount_total:
 *                   type: integer
 *                   description: total discount
 *                 tax_total:
 *                   type: integer
 *                   description: total tax
 *                 fee_total:
 *                   type: integer
 *                   description: total fee
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
const GetBillingStore = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const orderService: OrderService = req.scope.resolve('orderService')
  let storeId = null

  if (req.filterableFields.store_id) {
    storeId = req.filterableFields.store_id
  } else {
    storeId = loggedInUser.store_id
  }

  const result = await orderService.getBillingStore(storeId)

  res.status(200).json({ result })
}
export default GetBillingStore

export class GetBillingByStoreParams {
  @IsString()
  @IsOptional()
  store_id?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}
