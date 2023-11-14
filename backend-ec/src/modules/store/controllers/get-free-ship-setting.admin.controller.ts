import { IsInt } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import StoreService from '../services/store.service'
/**
 * @oas [get] /mystore/free-ship-setting
 * operationId: "GetFreeShippingStore"
 * summary: "get Free Shipping a store"
 * description: "Get free shipping a store which can be associated with an logged in user."
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
 *           $ref: "#/components/schemas/GetFreeShipSettingReq"
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
const getFreeShippingStoreController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const storeService: StoreService = req.scope.resolve('storeService')
  const amount = await storeService.getFreeShippingStore(loggedInUser.store_id)
  res.status(200).json({ amount: amount.free_ship_amount })
}
export default getFreeShippingStoreController

/**
 * @schema GetFreeShipSettingReq
 * title: "GetFreeShipSettingReq"
 * description: "Get Free Ship Setting Req"
 * x-resourceId: GetFreeShipSettingReq
 * type: object
 * required:
 *   - amount
 * properties:
 *  amount:
 *    type: number
 *    description: amount of store
 *    example: 0
 */
export class UserRegisterReq {
  @IsInt()
  amount: number
}
