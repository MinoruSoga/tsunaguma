import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ChattingService } from '../chatting.service'
import { MessageTypes } from '../entities/chatting-message.entity'

/**
 * @oas [post] /chatting/messages/{id}
 * operationId: "SendNewMessage"
 * summary: "Send new chatting messages"
 * description: "Send new chatting messages."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the chatting thread.
 * requestBody:
 *   description: Params to send new message
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/SendMessageReq"
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
 *            $ref: "#/components/schemas/chattingMessage"
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

  const threadId = req.params.id
  const validated = await validator(SendMessageReq, req.body)
  const message = validated.message
  const type = <MessageTypes>validated.type
  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const data = await chattingService.sendMessage(
    message,
    type,
    threadId,
    loggedInUser.id,
  )

  res.json(data)
}

/**
 * @schema SendMessageReq
 * title: "SendMessageReq"
 * description: "Send message params"
 * x-resourceId: SendMessageReq
 * type: object
 * required:
 *   - message
 *   - type
 * properties:
 *  message:
 *    type: string
 *    description: Content of message
 *    example: message
 *  type:
 *    type: string
 *    enum: [string, image, pdf, docx, xlsx]
 *    description: Type of message
 *    example: string
 */
export class SendMessageReq {
  @IsString()
  @IsNotEmpty()
  message: string

  @IsNotEmpty()
  @IsEnum(MessageTypes, { each: true })
  type: string
}
