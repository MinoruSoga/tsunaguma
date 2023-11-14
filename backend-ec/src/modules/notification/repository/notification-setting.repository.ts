import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { NotificationSettings } from '../entities/notification-settings.entity'

@MedusaRepository()
@EntityRepository(NotificationSettings)
export class NotificationSettingRepository extends Repository<NotificationSettings> {}
