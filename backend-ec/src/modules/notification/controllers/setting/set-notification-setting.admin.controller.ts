import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsBoolean, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { NotificationSettingService } from '../../services/notification-setting.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [put] /notification-settings
 * operationId: "set-notification-settings"
 * summary: "set notification settings"
 * description: "set notification settings"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateNotificationSettingReq"
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
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const notificationService = req.scope.resolve(
    'notificationSettingService',
  ) as NotificationSettingService

  const validated = await validator(UpdateNotificationSettingReq, req.body)
  const notiSetting = await notificationService.update(
    validated,
    loggedInUser.id,
  )

  res.status(200).json(notiSetting)
}

/**
 * @schema UpdateNotificationSettingReq
 * title: "UpdateNotificationSettingReq"
 * description: "UpdateNotificationSetting Req"
 * x-resourceId: UpdateNotificationSettingReq
 * type: object
 * properties:
 *   is_newletter:
 *     type: boolean
 *   is_favorite:
 *     type: boolean
 *   is_points:
 *     type: boolean
 *   is_review:
 *     type: boolean
 *   is_newproducts_follow:
 *     type: boolean
 *   is_permission_sns:
 *     type: boolean
 *   is_coupon:
 *     type: boolean
 */
export class UpdateNotificationSettingReq {
  @IsBoolean()
  @IsOptional()
  is_newletter: boolean

  @IsOptional()
  is_points: boolean

  @IsBoolean()
  @IsOptional()
  is_favorite: boolean

  @IsBoolean()
  @IsOptional()
  is_review: boolean

  @IsBoolean()
  @IsOptional()
  is_newproducts_follow: boolean

  @IsBoolean()
  @IsOptional()
  is_permission_sns: boolean

  @IsBoolean()
  @IsOptional()
  is_coupon: boolean
}
