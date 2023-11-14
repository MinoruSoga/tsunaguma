import { NotificationRepository as MedusaNotificationRepository } from '@medusajs/medusa/dist/repositories/notification'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { Notification } from '../entities/notification.entity'

@MedusaRepository({ override: MedusaNotificationRepository })
@EntityRepository(Notification)
export class NotificationRepository extends Utils.repositoryMixin<
  Notification,
  MedusaNotificationRepository
>(MedusaNotificationRepository) {}
