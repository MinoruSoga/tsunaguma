/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  AdminGetNotificationsParams,
  defaultAdminNotificationsFields,
  defaultAdminNotificationsRelations,
} from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import _ from 'lodash'
import { Validator } from 'medusa-extender'

import NotificationManagerService from '../../../services/notification-manager.service'
import { NotificationType } from '../entities/notification.entity'
import { Notification } from '../entities/notification.entity'
import { NotificationService } from '../services/notification.service'

/**
 * @oas [get] /notifications
 * operationId: "GetNotifications"
 * summary: "List Notifications"
 * description: "Retrieves a list of Notifications."
 * x-authenticated: true
 * parameters:
 *   - (query) offset=0 {integer} The number of notifications to skip before starting to collect the notifications set
 *   - (query) limit=50 {integer} The number of notifications to return
 *   - (query) fields {string} Comma separated fields to include in the result set
 *   - (query) expand {string} Comma separated fields to populate
 *   - (query) event_name {string} The name of the event that the notification was sent for.
 *   - (query) resource_type {string} The type of resource that the Notification refers to.
 *   - (query) resource_id {string} The ID of the resource that the Notification refers to.
 *   - (query) customer_id {string} The ID of the customer that the Notification refers to.
 *   - (query) type {string} The type of the Notification.
 *   - (query) to {string} The address that the Notification was sent to. This will usually be an email address, but represent other addresses such as a chat bot user id
 *   - (query) include_resends {string} A boolean indicating whether the result set should include resent notifications or not
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       // must be previously logged in or use api token
 *       medusa.admin.notifications.list()
 *       .then(({ notifications }) => {
 *         console.log(notifications.length);
 *       });
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl --location --request GET 'https://medusa-url.com/admin/notifications' \
 *       --header 'Authorization: Bearer {api_token}'
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Notification
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *            - count
 *            - notifications
 *           properties:
 *             notifications:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/notification"
 *             count:
 *               type: number
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
export default async (req, res) => {
  const notificationService: NotificationService = req.scope.resolve(
    'notificationService',
  )

  const {
    limit,
    offset,
    fields,
    expand,
    event_name,
    resource_id,
    resource_type,
    to,
    customer_id,
    type,
    include_resends,
  } = await validator(ExtendedAdminGetNotificationsParams, req.query)

  const selector: Record<string, unknown> = {}

  let includeFields: string[] = []
  if (fields) {
    includeFields = fields.split(',')
  }

  let expandFields: string[] = []
  if (expand) {
    expandFields = expand.split(',')
  }

  if (event_name) {
    const values = event_name.split(',')
    selector.event_name = values.length > 1 ? values : values[0]
  }

  if (resource_type) {
    const values = resource_type.split(',')
    selector.resource_type = values.length > 1 ? values : values[0]
  }

  if (resource_id) {
    const values = resource_id.split(',')
    selector.resource_id = values.length > 1 ? values : values[0]
  }

  // get notifications of an user
  if (customer_id) {
    selector.customer_id = customer_id
  }

  if (type) {
    selector.noti_type = type
  }

  if (to) {
    const values = to.split(',')
    selector.to = values.length > 1 ? values : values[0]
  }

  if (!include_resends || include_resends === 'false') {
    selector.parent_id = null
  }

  // not include email notification
  selector.provider_id = NotificationManagerService.identifier

  const listConfig = {
    select: (includeFields.length
      ? includeFields
      : defaultAdminNotificationsFields.concat([
          'data',
          'noti_type',
          'customer_id',
          'user_read',
        ])) as (keyof Notification)[],
    relations: expandFields.length
      ? expandFields
      : defaultAdminNotificationsRelations,
    skip: offset,
    take: limit,
    order: { created_at: 'DESC' },
  } as FindConfig<Notification>

  // @ts-ignore
  const [notifications, count] = await notificationService.listAndCount(
    selector,
    listConfig,
  )

  const resultFields = [
    ...(listConfig.select ?? []),
    ...(listConfig.relations ?? []),
  ]
  const data = notifications.map((o) => _.pick(o, resultFields))

  res.json({ notifications: data, count })
}

@Validator({ override: AdminGetNotificationsParams })
export class ExtendedAdminGetNotificationsParams extends AdminGetNotificationsParams {
  @IsOptional()
  @IsString()
  customer_id?: string

  @IsOptional()
  @IsEnum(NotificationType, {
    always: true,
    message: `Invalid value (notification type must be one of following values: ${Object.values(
      NotificationType,
    ).join(', ')})`,
  })
  type: NotificationType
}
