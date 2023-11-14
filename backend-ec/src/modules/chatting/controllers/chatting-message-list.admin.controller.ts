import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ChattingService } from '../chatting.service'

/**
 * @oas [get] /chatting/messages/{id}
 * operationId: "GetListChattingMessage"
 * summary: "Get list chatting messages"
 * description: "Get list chatting messages."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the chatting thread.
 *   - in: query
 *     name: limit
 *     schema:
 *       type: integer
 *     description: The numbers of items to return
 *   - in: query
 *     name: skip
 *     schema:
 *       type: integer
 *     description: current page
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Chatting
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  items:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/chattingMessage"
 *                  count:
 *                    type: integer
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
export default async (req: MedusaRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const id = req.params.id

  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const limit = parseInt(<string>req.query.limit) || 10
  const skip = parseInt(<string>req.query.skip) || 0

  const [data, count] = await chattingService.messages(
    loggedInUser.id,
    id,
    limit,
    skip,
  )
  res.json({
    items: data,
    count,
  })
}
