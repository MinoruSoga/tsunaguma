import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { PaybackSettingService } from '../../services/payback-setting.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'
import { LoggedInUser } from './../../../../interfaces/loggedin-user'

/**
 * @oas [get] /mystore/payback-setting
 * operationId: "GetPaybackSetting"
 * summary: "Get payback setting of the store"
 * description: "Get payback setting of the store"
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
 *      application/json:
 *        schema:
 *           $ref: "#/components/schemas/payback_setting"
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
 */

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const paybackSettingService = req.scope.resolve(
    'paybackSettingService',
  ) as PaybackSettingService

  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser.store_id) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'This user does not have a store',
    )
  }

  const payback = await paybackSettingService.retrieveByStore(
    loggedInUser.store_id,
    false,
  )

  res.status(200).json(payback)
}
