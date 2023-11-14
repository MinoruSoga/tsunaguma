import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { PointService } from '../services/point.service'

/**
 * @oas [get] /point/history
 * operationId: "UserPointHistory"
 * summary: "User Point History"
 * description: "get point history for use"
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: take
 *     schema:
 *       type: integer
 *     description: The numbers of items to return
 *   - in: query
 *     name: page
 *     schema:
 *       type: integer
 *     description: current page
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
 *            type: object
 *            properties:
 *                items:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/userPointHistory'
 *                count:
 *                  type: integer
 *                  description: count result
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
  const histories = await pointService.list(req, loggedInUser.id)

  res.send(histories)
}
