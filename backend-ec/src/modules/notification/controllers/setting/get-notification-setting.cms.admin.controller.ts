import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { NotificationSettingService } from '../../services/notification-setting.service'

/**
 * @oas [get] /notification-settings/{id}
 * operationId: "GetNotificationSettingByUser"
 * summary: "get notification settings by user"
 * description: "get notification settings by user"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The Id of user
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
 *           $ref: "#/components/schemas/notification_setting"
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
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const notificationService = req.scope.resolve(
    'notificationSettingService',
  ) as NotificationSettingService
  const { id } = req.params
  const notiSetting = await notificationService.retrieve_(id)

  res.status(200).json(notiSetting)
}
