import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import checkUserUnreadNotificationsAdminController from './controllers/check-user-unread-notifications.admin.controller'
import getUserNotificationsAdminController from './controllers/get-user-notifications.admin.controller'
import NotificationActionAdminController from './controllers/notification-action.admin.controller'
import NotificationListAdminController from './controllers/notification-list.admin.controller'
import getNotificationSettingAdminController from './controllers/setting/get-notification-setting.admin.controller'
import getNotificationSettingCmsAdminController from './controllers/setting/get-notification-setting.cms.admin.controller'
import setNotificationSettingAdminController from './controllers/setting/set-notification-setting.admin.controller'
import setNotificationSettingCmsAdminController from './controllers/setting/set-notification-setting.cms.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/notifications',
      method: 'get',
      handlers: [wrapHandler(getUserNotificationsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/notification/user',
      method: 'get',
      handlers: [wrapHandler(NotificationListAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/notification/user/action',
      method: 'put',
      handlers: [wrapHandler(NotificationActionAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/notification-settings',
      method: 'get',
      handlers: [wrapHandler(getNotificationSettingAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/notification-settings',
      method: 'put',
      handlers: [wrapHandler(setNotificationSettingAdminController)],
    },
    ,
    {
      requiredAuth: true,
      path: '/admin/notification-settings/:id',
      method: 'get',
      handlers: [wrapHandler(getNotificationSettingCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/notification-settings/:id',
      method: 'put',
      handlers: [wrapHandler(setNotificationSettingCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/notification/check-unread',
      method: 'get',
      handlers: [wrapHandler(checkUserUnreadNotificationsAdminController)],
    },
  ],
})
export class NotificationRouter {}
