import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ChattingService } from '../chatting.service'

/**
 * @oas [get] /chatting/threads/total/unread
 * operationId: "TotalUnreadChattingThread"
 * summary: "Get total unread chatting thread"
 * description: "Get total unread chatting thread"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Chatting
 * responses:
 *   "200":
 *    description: OK
 *    content:
 *       application/json:
 *         schema:
 *            type: object
 *            properties:
 *              total:
 *                type: integer
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
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }
  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const data = await chattingService.totalUnreadChattingThread(loggedInUser.id)

  res.status(200).json(data)
}
