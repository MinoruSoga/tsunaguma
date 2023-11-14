import { TransactionBaseService } from '@medusajs/medusa'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import UserRepository from '../../user/user.repository'
import { NotificationSettings } from '../entities/notification-settings.entity'
import { NotificationSettingRepository } from '../repository/notification-setting.repository'

type InjectedDependencies = {
  manager: EntityManager
  notificationSettingRepository: typeof NotificationSettingRepository
  userRepository: typeof UserRepository
}

type UpdateNotificationSettingInput = {
  is_coupon?: boolean
  is_favorite?: boolean
  is_newletter?: boolean
  is_newproducts_follow?: boolean
  is_permission_sns?: boolean
  is_points?: boolean
  is_review?: boolean
}

@Service()
export class NotificationSettingService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected userRepo_: typeof UserRepository
  static resolutionKey = 'notificationSettingService'

  protected readonly notificationSettingRepository_: typeof NotificationSettingRepository
  private readonly manager: EntityManager

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.notificationSettingRepository_ =
      container.notificationSettingRepository
    this.userRepo_ = container.userRepository
  }

  async create(data: DeepPartial<NotificationSettings>) {
    const notiRepo = this.manager_.getCustomRepository(
      this.notificationSettingRepository_,
    )
    const createdData = notiRepo.create(data)
    return await notiRepo.save(createdData)
  }

  public async retrieve(userId: string) {
    const notiRepo = this.manager_.getCustomRepository(
      this.notificationSettingRepository_,
    )
    const userRepo = this.manager_.getCustomRepository(this.userRepo_)
    const notiSetting = await notiRepo
      .createQueryBuilder('notification_setting')
      .select('notification_setting')
      .where(' user_id = :userId', { userId: userId })
      .getOne()
    const user = await userRepo.findOne(userId)

    if (!notiSetting && user) {
      const data: DeepPartial<NotificationSettings> = {
        is_coupon: true,
        is_favorite: true,
        is_newletter: true,
        is_newproducts_follow: true,
        is_permission_sns: true,
        is_points: true,
        is_review: true,
        user_id: userId,
      }
      return await this.create(data)
    }
    return notiSetting
  }

  async update(data: UpdateNotificationSettingInput, userId: string) {
    const notiSetting = await this.retrieve(userId)
    const notiRepo = this.manager_.getCustomRepository(
      this.notificationSettingRepository_,
    )
    const result: DeepPartial<NotificationSettings> = {
      ...notiSetting,
      ...data,
    }

    await notiRepo.save(result)
    return await this.retrieve(userId)
  }

  public async retrieve_(userId: string) {
    const notiRepo = this.manager_.getCustomRepository(
      this.notificationSettingRepository_,
    )

    const userRepo = this.manager_.getCustomRepository(this.userRepo_)

    const notiSetting = await notiRepo
      .createQueryBuilder('notification_setting')
      .select('notification_setting')
      .where(' user_id = :userId', { userId: userId })
      .getOne()

    const user = await userRepo.findOne(userId)

    if (!notiSetting && user) {
      const data: DeepPartial<NotificationSettings> = {
        is_coupon: true,
        is_favorite: true,
        is_newletter: true,
        is_newproducts_follow: true,
        is_permission_sns: true,
        is_points: true,
        is_review: true,
        user_id: userId,
      }
      return await this.create(data)
    }
    return notiSetting
  }

  async update_(userId: string, data: UpdateNotificationSettingInput) {
    const notiRepo = this.manager_.getCustomRepository(
      this.notificationSettingRepository_,
    )

    const tmp = await this.retrieve_(userId)

    const notiSetting = { ...tmp, ...data }

    return await notiRepo.save(notiSetting)
  }

  async checkSetting(userId: string, key: string) {
    const setting = await this.retrieve_(userId)

    if (setting) {
      return setting[key] ?? false
    }

    return false
  }
}
