import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import StoreService from '../services/store.service'
import { LOGGED_IN_USER_KEY } from './../../../helpers/constant'
import { LoggedInUser } from './../../../interfaces/loggedin-user'

/**
 * @oas [put] /mystore/reset-new-transaction
 * operationId: "ResetNewTransaction"
 * summary: "Reset new transaction cnt of the store"
 * description: "Reset new transaction cnt of the store"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   204:
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
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const storeService = req.scope.resolve('storeService') as StoreService

  if (!loggedInUser.store_id)
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')

  await storeService.resetNewTransaction(loggedInUser.store_id)

  res.sendStatus(204)
}
