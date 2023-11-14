import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { PointService } from '../services/point.service'

/**
 * @oas [get] /point/about-expired
 * operationId: "UserPointExpired"
 * summary: "User Point Expired"
 * description: "get point about to expired"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Point
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *       application/json:
 *         schema:
 *            $ref: '#/components/schemas/userPointHistory'
 *  "400":
 *     $ref: "#/components/responses/400_error"
 *  "404":
 *     $ref: "#/components/responses/not_found_error"
 *  "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *     $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }
  const pointService = req.scope.resolve('pointService') as PointService
  const pointExpired = await pointService.getPointExpired(loggedInUser.id)

  res.send(pointExpired)
}
