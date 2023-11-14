import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ChattingService } from '../chatting.service'
import { ReadStatus } from '../entities/chatting-message.entity'

/**
 * @oas [get] /chatting/threads
 * operationId: "ListChattingThreads"
 * summary: "List chatting threads"
 * description: "List chatting threads"
 * x-authenticated: true
 * parameters:
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
 *   - in: query
 *     name: read_status
 *     schema:
 *       type: string
 *       enum: [all, un_read, read]
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
 *                  count:
 *                    type: integer
 *                  items:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/chattingThread"
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

  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const limit = parseInt(<string>req.query.limit) || 10
  const skip = parseInt(<string>req.query.skip) || 0
  const readStatus: ReadStatus =
    <ReadStatus>req.query.read_status || ReadStatus.ALL

  const data = await chattingService.listThread(
    loggedInUser.id,
    readStatus,
    limit,
    skip,
  )
  res.json(data)
}
