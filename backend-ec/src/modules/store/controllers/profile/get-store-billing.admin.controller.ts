import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { FEE_TRANFER, LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { OrderService } from '../../../order/services/order.service'
import StoreService from '../../services/store.service'

/**
 * @oas [get] /mystore/billing
 * operationId: "GetStoreBilling"
 * summary: "get store billing"
 * description: "get store billing."
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/storeBilling"
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
const getStoreBillingController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const orderService: OrderService = req.scope.resolve('orderService')
  const storeService: StoreService = req.scope.resolve('storeService')
  let storeBilling = await storeService.getStoreBilling(loggedInUser.store_id)
  if (storeBilling) {
    const billing = await orderService.getTotalOfBilling(storeBilling.id)
    const data = {
      total_origin_price: billing.total,
      total_delivery_price: billing.shipping_total,
      total_fee: billing.fee_total,
      total_price: billing.subtotal - FEE_TRANFER,
    }
    storeBilling = await storeService.updateStoreBilling(storeBilling.id, data)
  }
  res.status(200).json(storeBilling)
}
export default getStoreBillingController
