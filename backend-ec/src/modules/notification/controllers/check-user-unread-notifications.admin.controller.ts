import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import NotificationManagerService from '../../../services/notification-manager.service'
import { NotificationService } from '../services/notification.service'

/**
 * @oas [get] /notification/check-unread
 * operationId: "CheckNotificationUnread"
 * summary: "Check if logged in user has unread notifications or not"
 * description: "Check if logged in user has unread notifications or not"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Notification
 * responses:
 *   200:
 *    description: OK
 *    content:
 *     application/json:
 *      schema:
 *        type: object
 *        required:
 *         - unread_count
 *        properties:
 *          unread_count:
 *             type: number
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
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const notificationService = req.scope.resolve<NotificationService>(
    NotificationService.resolutionKey,
  )

  const [, total] = await notificationService.listAndCount({
    user_read: false,
    customer_id: loggedInUser.id,
    provider_id: NotificationManagerService.identifier,
  })

  res.json({ unread_count: total })
}
