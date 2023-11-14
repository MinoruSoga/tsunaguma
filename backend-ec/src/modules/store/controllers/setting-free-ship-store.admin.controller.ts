import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsInt, Min } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import StoreService from '../services/store.service'
/**
 * @oas [put] /mystore/free-ship-setting
 * operationId: "SetFreeShippingStore"
 * summary: "set Free Shipping a store"
 * description: "Set free shipping a store which can be associated with an logged in user."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/FreeShippingReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store-free-ship-setting
 * responses:
 *   200:
 *     description: OK
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
const setFreeShippingStoreController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const validated = await validator(FreeShippingReq, req.body)
  const storeService: StoreService = req.scope.resolve('storeService')
  await storeService.setFreeShippingStore(
    loggedInUser.store_id,
    validated.amount,
  )
  res.sendStatus(200)
}

/**
 * @schema FreeShippingReq
 * title: "FreeShippingReq"
 * description: "Free Ship Setting"
 * x-resourceId: FreeShippingReq
 * type: object
 * required:
 *   - amount
 * properties:
 *  amount:
 *    type: integer
 *    description: free shipping amount of store
 *    example: 1
 */
export class FreeShippingReq {
  @IsInt()
  @Min(0)
  amount: number
}
export default setFreeShippingStoreController
