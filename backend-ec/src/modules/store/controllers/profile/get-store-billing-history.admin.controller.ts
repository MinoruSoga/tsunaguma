import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { LineItem } from '../../../cart/entity/line-item.entity'
import { TotalsService } from '../../../cart/services/totals.service'
import { OrderService } from '../../../order/services/order.service'
import StoreService from '../../services/store.service'

/**
 * @oas [get] /mystore/billing-history
 * operationId: "GetStoreBillingHistory"
 * summary: "get store billing history"
 * description: "get store billing history."
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of order
 * tags:
 *   - Store
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             billing:
 *               $ref: "#/components/schemas/storeBilling"
 *             orders:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/order"
 *             count:
 *               type: integer
 *               description: The total number of items available
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
const getStoreBillingHistoryController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }
  const storeService: StoreService = req.scope.resolve('storeService')
  const totalService: TotalsService = req.scope.resolve('totalsService')
  const orderService: OrderService = req.scope.resolve('orderService')

  const { billing, orders, count } = await storeService.getStoreBillingHistory(
    loggedInUser.store_id,
    req.listConfig.take,
    req.listConfig.skip,
  )

  const rl = []

  for (const r of orders) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    r.items = await Promise.all(
      r.items.map(async (item: LineItem) => {
        const itemsTotal = await totalService.getLineItemTotals(item, r as any)
        return Object.assign(item, itemsTotal)
      }),
    )

    rl.push(r)
  }

  const result = []
  for (const item of rl) {
    result.push(await orderService.decorateVariantOptions(item))
  }

  const rsOrders = await Promise.all(
    result.map(async (i) => await orderService.convertOrders(i)),
  )

  let rsBill = billing
  if (rsBill) {
    const bill = await orderService.getTotalOfBilling(billing.id)
    const data = {
      total_origin_price: bill.total,
      total_delivery_price: bill.shipping_total,
      total_fee: bill.fee_total,
      total_price: bill.subtotal,
    }
    rsBill = await storeService.updateStoreBilling(billing.id, data)
  }

  res.status(200).json({ billing: rsBill, orders: rsOrders, count })
}
export default getStoreBillingHistoryController

export class GetBillingHistoryParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}
