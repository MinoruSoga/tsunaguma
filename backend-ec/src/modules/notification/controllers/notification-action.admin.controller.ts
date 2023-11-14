import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import {
  ActionType,
  NotificationService,
} from '../services/notification.service'

/**
 * @oas [put] /notification/user/action
 * operationId: "NotificationAction"
 * summary: "Action of notification"
 * description: "Action of notification"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/NotificationActionReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Notification
 * responses:
 *   204:
 *     description: ok
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
  const notificationService = req.scope.resolve(
    'notificationService',
  ) as NotificationService

  const validated: NotificationActionReq = await validator(
    NotificationActionReq,
    req.body,
  )
  await notificationService.updateOrDeleteNotificationById(validated)

  res.sendStatus(204)
}

/**
 * @schema NotificationActionReq
 * title: "NotificationActionReq"
 * description: "Notification action request"
 * x-resourceId: NotificationActionReq
 * type: object
 * required:
 *   - notificationIds
 *   - action
 * properties:
 *  action:
 *    type: string
 *    description: reason
 *    example: read
 *  notification_ids:
 *    type: array
 *    description: list id for notification
 *    example:  ["noti_03GHFV33XWQE6AEKAQD647XZKZ", "noti_02GHFV33XWQE6AEKAQD647XZKZ"]
 */
export class NotificationActionReq {
  @IsArray()
  @ArrayMinSize(1)
  notification_ids: string[]

  @IsString()
  @IsNotEmpty()
  @IsEnum(ActionType, { each: true })
  action: string
}
