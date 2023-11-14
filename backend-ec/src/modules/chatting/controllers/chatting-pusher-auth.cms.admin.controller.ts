import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import StoreService from '../../../modules/store/services/store.service'
import { isAdmin } from '../../../modules/user/constant'
import UserService from '../../../modules/user/services/user.service'
import { ChattingService } from '../chatting.service'

/**
 * @oas [post] /chatting/pusher/auth/cms
 * operationId: "ChattingPusherAuthenticationCms"
 * summary: "Authentication pusher user"
 * description: "Authentication pusher user"
 * x-authenticated: true
 * requestBody:
 *   description: Params to send new message
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ChattingPusherAuthCmsReq"
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
 *            $ref: "#/components/schemas/ChattingPusherAuthCmsRes"
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

  const validated = await validator(ChattingPusherAuthCmsReq, req.body)

  const storeId = validated.thread_id.substring(
    validated.thread_id.indexOf('-') + 1,
  )

  const userService = req.scope.resolve('userService') as UserService
  const storeService: StoreService = req.scope.resolve('storeService')

  const store = await storeService.retrieve_(storeId, { select: ['owner_id'] })
  const user = await userService.retrieve(store.owner_id)

  const socketId = validated.socket_id
  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const data = await chattingService.authenticationPusher(socketId, user)

  res.json(data)
}

/**
 * @schema ChattingPusherAuthCmsReq
 * title: "ChattingPusherAuthCmsReq"
 * description: "Authentication pusher request"
 * x-resourceId: ChattingPusherAuthCmsReq
 * type: object
 * required:
 *   - socket_id
 *   - thread_id
 * properties:
 *  socket_id:
 *    type: string
 *    description: ID of socket
 *  thread_id:
 *    type: string
 *    description: ID of thread
 */
export class ChattingPusherAuthCmsReq {
  @IsString()
  @IsNotEmpty()
  socket_id: string

  @IsString()
  @IsNotEmpty()
  thread_id: string
}

/**
 * @schema ChattingPusherAuthCmsRes
 * title: "ChattingPusherAuthCmsRes"
 * description: "Authentication pusher response"
 * x-resourceId: ChattingPusherAuthCmsRes
 * properties:
 *  channel_data:
 *    type: string
 *  auth:
 *    type: string
 *  shared_secret:
 *    type: string
 */
