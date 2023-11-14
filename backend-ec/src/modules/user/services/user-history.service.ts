import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { StoreDetailRepository } from 'src/modules/store/repository/store-detail.repository'
import { EntityManager } from 'typeorm'

import { NotificationSettingService } from '../../../modules/notification/services/notification-setting.service'
import { PointService } from '../../../modules/point/services/point.service'
import { UserHistory } from '../entity/user-history.entity'
import { UserHistoryRepository } from '../repository/user-history.repository'
import UserService from './user.service'

type InjectedDependencies = {
  manager: EntityManager
  userService: UserService
  userHistoryRepository: typeof UserHistoryRepository
  notificationSettingService: NotificationSettingService
  pointService: PointService
  storeDetailRepository: typeof StoreDetailRepository
}

@Service()
export class UserHistoryService extends TransactionBaseService {
  static resolutionKey = 'userHistoryService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies

  protected readonly userService: UserService
  protected readonly userHistoryRepository_: typeof UserHistoryRepository
  protected readonly notificationSettingService: NotificationSettingService
  protected readonly pointService_: PointService
  protected readonly storeDetailRepository_: typeof StoreDetailRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.userService = container.userService
    this.userHistoryRepository_ = container.userHistoryRepository
    this.notificationSettingService = container.notificationSettingService
    this.pointService_ = container.pointService
    this.storeDetailRepository_ = container.storeDetailRepository
  }
  async listHistory(userId: string, config: FindConfig<UserHistory>) {
    const userHistoryRepo = this.manager_.getCustomRepository(
      this.userHistoryRepository_,
    )
    const query = buildQuery(
      { user_id: userId },
      { ...config, relations: ['creator'] },
    )

    return await userHistoryRepo.findAndCount(query)
  }

  async create_(userId: string, createdBy: string) {
    return await this.atomicPhase_(async (manager) => {
      const userHistoryRepo = manager.getCustomRepository(
        this.userHistoryRepository_,
      ) as UserHistoryRepository

      const storeDetailRepo = manager.getCustomRepository(
        this.storeDetailRepository_,
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await this.userService.retrieve(userId, {
        relations: ['address', 'customer'],
      })

      const storeDetail = await storeDetailRepo.findOne({
        where: { user_id: user?.id },
      })

      const notificationSettings =
        await this.notificationSettingService.retrieve_(user.id)
      user.notificationSettings = notificationSettings

      const history = userHistoryRepo.create({
        user_id: userId,
        created_by: createdBy,
        metadata: { user, storeDetail },
      })
      return await userHistoryRepo.save(history)
    })
  }

  async getOne(id: string) {
    const userHistoryRepo = this.manager_.getCustomRepository(
      this.userHistoryRepository_,
    )

    const history = await userHistoryRepo.findOne({
      where: { id },
    })
    const point = await this.pointService_.getTotalPoint(history.user_id)
    history.metadata = {
      ...history.metadata,
      point: { total: point },
    }

    return history
  }
}
