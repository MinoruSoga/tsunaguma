import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { RegisterTokenPayload } from '../services/user.service'

/**
 * @oas [get] /users/forgot-password/{token}
 * operationId: "CheckUserResetPasswordToken"
 * summary: "Check User Reset Password Token"
 * description: "Check reset password token's validation"
 * x-authenticated: false
 * parameters:
 *   - (path) token=* {string} The reset password token of the User.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/RequestForgotPwReq"
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
export default async (req: MedusaRequest, res: Response) => {
  const payload: RegisterTokenPayload = req.scope.resolve('resetPasswordUser')

  res.status(200).json({ email: payload.email })
}
