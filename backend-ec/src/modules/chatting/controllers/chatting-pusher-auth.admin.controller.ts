import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'
import UserService from 'src/modules/user/services/user.service'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ChattingService } from '../chatting.service'

/**
 * @oas [post] /chatting/pusher/auth
 * operationId: "ChattingPusherAuthentication"
 * summary: "Authentication pusher user"
 * description: "Authentication pusher user"
 * x-authenticated: true
 * requestBody:
 *   description: Params to send new message
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ChattingPusherAuthReq"
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
 *            $ref: "#/components/schemas/ChattingPusherAuthRes"
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
  const userService = req.scope.resolve('userService') as UserService
  const user = await userService.retrieve(loggedInUser.id)
  const validated = await validator(ChattingPusherAuthReq, req.body)
  const socketId = validated.socket_id
  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const data = await chattingService.authenticationPusher(socketId, user)

  res.json(data)
}

/**
 * @schema ChattingPusherAuthReq
 * title: "ChattingPusherAuthReq"
 * description: "Authentication pusher request"
 * x-resourceId: ChattingPusherAuthReq
 * type: object
 * required:
 *   - socket_id
 * properties:
 *  socket_id:
 *    type: string
 *    description: ID of socket
 */
export class ChattingPusherAuthReq {
  @IsString()
  @IsNotEmpty()
  socket_id: string
}

/**
 * @schema ChattingPusherAuthRes
 * title: "ChattingPusherAuthRes"
 * description: "Authentication pusher response"
 * x-resourceId: ChattingPusherAuthRes
 * properties:
 *  channel_data:
 *    type: string
 *  auth:
 *    type: string
 *  shared_secret:
 *    type: string
 */
