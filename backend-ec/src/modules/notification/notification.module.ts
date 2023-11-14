import { Module } from 'medusa-extender'

import { ExtendedAdminGetNotificationsParams } from './controllers/get-user-notifications.admin.controller'
import { Notification } from './entities/notification.entity'
import { NotificationSettings } from './entities/notification-settings.entity'
import { NotificationMigration1668048525551 } from './migrations/1668048525551-notification.migration'
import { NotificationMigration1669690427302 } from './migrations/1669690427302-notification.migration'
import { NotificationMigration1671711089368 } from './migrations/1671711089368-notification.migration'
import { NotificationMigration1672299712225 } from './migrations/1672299712225-notification.migration'
import { NotificationRouter } from './notification.router'
import { NotificationRepository } from './repository/notification.repository'
import { NotificationSettingRepository } from './repository/notification-setting.repository'
import { NotificationService } from './services/notification.service'
import { NotificationSettingService } from './services/notification-setting.service'

@Module({
  imports: [
    NotificationRouter,
    NotificationService,
    NotificationMigration1668048525551,
    Notification,
    ExtendedAdminGetNotificationsParams,
    NotificationRepository,
    NotificationSettingRepository,
    NotificationSettingService,
    NotificationSettings,
    NotificationMigration1669690427302,
    NotificationMigration1671711089368,
    NotificationMigration1672299712225,
  ],
})
export class NotificationModule {}
