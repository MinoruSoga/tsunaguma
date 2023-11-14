import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { Events, NotificationService } from '../services/notification.service'

/**
 * @oas [get] /notification/user
 * operationId: "ListNotificationByUser"
 * summary: "list notification by user"
 * description: "list notification by user"
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
 *   - in: query
 *     name: type
 *     schema:
 *       type: string
 *     description: type notification, notification or reaction
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Notification
 * responses:
 *   200:
 *     description: ok
 *     content:
 *       application/json:
 *         schema:
 *            type: object
 *            properties:
 *                items:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/notification'
 *                count:
 *                  type: integer
 *                  description: count result
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

  const notificationService = req.scope.resolve(
    'notificationService',
  ) as NotificationService
  const validated: NotificationQueryParams = await validator(
    NotificationQueryParams,
    req.query,
  )

  const notifications = await notificationService.getListByUser(
    loggedInUser.id,
    validated,
  )

  res.send(notifications)
}

/**
 * @schema NotificationQueryParams
 * title: "NotificationQueryParams"
 * description: "Notification query params"
 * x-resourceId: NotificationQueryParams
 * type: object
 * properties:
 *  take:
 *    type: number
 *    description: number item
 *    example: 10
 *  page:
 *    type: number
 *    description: page number
 *    example: 2
 *  type:
 *    type: string
 *    description: type notification
 *    example: reaction
 */
export class NotificationQueryParams {
  @IsNumber()
  @Type(() => Number)
  take: number

  @IsNumber()
  @Type(() => Number)
  page: number

  @IsOptional()
  @IsString()
  @IsEnum(Events, { each: true })
  type: string
}
