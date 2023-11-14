import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ChattingService } from '../chatting.service'

/**
 * @oas [get] /chatting/threads/{id}/cms
 * operationId: "GetChattingThreadDetailCms"
 * summary: "Get chatting thread detail cms"
 * description: "Get chatting thread detail admin cms."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the chatting thread.
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
 *            $ref: "#/components/schemas/chattingThread"
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
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const id = req.params.id
  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const data = await chattingService.chattingThreadCms(id)
  res.json(data)
}
