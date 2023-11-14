import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ChattingService } from '../chatting.service'

/**
 * @oas [post] /chatting/threads/{id}/pin
 * operationId: "PinChattingThread"
 * summary: "Pin or un pin chatting thread"
 * description: "Pin or un pin chatting thread"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the chatting thread.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Chatting
 * responses:
 *   "201":
 *     description: Created Or Delete
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
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const id = req.params.id
  const chattingService: ChattingService = req.scope.resolve('chattingService')
  await chattingService.pinChattingThread(id, loggedInUser.id)

  res.sendStatus(201)
}
