import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import WithdrawalService from '../../services/withdrawal.service'

/**
 * @oas [post] /users/withdrawal/check
 * operationId: "CheckWithdrawal"
 * summary: "Check if current user can withdraw or not"
 * description: "Check if current user can withdraw or not"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Withdrawal
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             can_withdraw:
 *               type: boolean
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
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const withdrawalService = req.scope.resolve<WithdrawalService>(
    WithdrawalService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  const canWithdraw = await withdrawalService.checkWithdraw(loggedInUser.id)

  res.json({ can_withdraw: canWithdraw })
}
