/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NotificationProviderRepository } from '@medusajs/medusa/dist/repositories/notification-provider'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { NotificationService as MedusaNotificationService } from '@medusajs/medusa/dist/services'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, In } from 'typeorm'

import { PaginationType } from '../../../interfaces/pagination'
import { UserStatus } from '../../user/entity/user.entity'
import UserService from '../../user/services/user.service'
import { NotificationActionReq } from '../controllers/notification-action.admin.controller'
import { NotificationQueryParams } from '../controllers/notification-list.admin.controller'
import { Notification, NotificationType } from '../entities/notification.entity'
import { NotificationRepository } from '../repository/notification.repository'

export enum ActionType {
  READ = 'read',
  UN_READ = 'un_read',
  TRASH = 'trash',
}

export enum Events {
  NOTIFICATION = 'notification',
  REACTION = 'reaction',
}

type InjectedDependencies = {
  manager: EntityManager
  logger: Logger
  notificationRepository: typeof NotificationRepository
  notificationProviderRepository: typeof NotificationProviderRepository
  eventBusService: EventBusService
  userService: UserService
}

@Service({ override: MedusaNotificationService })
export class NotificationService extends MedusaNotificationService {
  static resolutionKey = 'notificationService'
  static Events = {
    NOTIFICATION: 'user.notification',
    REACTION: 'user.reaction',
    CREATED: 'notification.created',
  }

  private readonly manager: EntityManager
  private readonly notificationRepository: typeof NotificationRepository
  private readonly userService_: UserService

  private eventBus_: EventBusService

  constructor(private readonly container: InjectedDependencies) {
    super(container)

    this.manager = container.manager
    this.eventBus_ = container.eventBusService
    this.userService_ = container.userService
    this.notificationRepository = container.notificationRepository
  }

  public async getListByUser(
    userId: string,
    query: NotificationQueryParams,
  ): Promise<PaginationType<Notification>> {
    const notificationRepo = this.manager.getCustomRepository(
      this.notificationRepository,
    )
    const take = query.take || 20
    const page = query.page || 1
    const skip = (page - 1) * take
    const type = query.type
    const [result, total] = await notificationRepo.findAndCount({
      where: {
        customer_id: userId,
        event_name:
          type === Events.REACTION
            ? NotificationService.Events.REACTION
            : NotificationService.Events.NOTIFICATION,
      },
      order: {
        created_at: 'DESC',
      },
      take: take,
      skip: skip,
    })

    return {
      items: [...result],
      count: total,
    }
  }

  public async updateOrDeleteNotificationById(
    req: NotificationActionReq,
  ): Promise<void> {
    const notificationRepo = this.manager.getCustomRepository(
      this.notificationRepository,
    )
    const notificationIds = req.notification_ids
    if (req.action === ActionType.READ || req.action === ActionType.UN_READ) {
      await notificationRepo
        .createQueryBuilder()
        .update(Notification)
        .set({ user_read: req.action === ActionType.READ })
        .where({ id: In(notificationIds) })
        .execute()
    } else {
      const notifications = await notificationRepo.findByIds(notificationIds)
      if (!notifications) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Some Notifications not found, no changes applied!`,
        )
      }
      await notificationRepo.softRemove(notifications)
    }
  }

  async send(
    event: string,
    eventData: Record<string, unknown>,
    providerId: string,
  ): Promise<Notification | undefined> {
    return await this.atomicPhase_(async (transactionManager) => {
      const provider = this.retrieveProvider_(providerId)
      const result = await provider.sendNotification(
        event,
        eventData,
        this.attachmentGenerator_,
      )

      if (!result) {
        return
      }

      const { to, data } = result

      const notiRepo = transactionManager.getCustomRepository(
        this.notificationRepository_,
      )

      const [resource_type] = event.split('.') as string[]
      const resource_id = eventData.id as string
      const customer_id = (eventData.customer_id as string) || null
      const noti_type = (eventData.type as string) || null

      // check if email exists or not, if not, don't send notification
      if (Boolean(customer_id)) {
        const isActive = await this.userService_
          .withTransaction(transactionManager)
          .isActive(customer_id)
        if (!isActive) return
      }

      // @ts-ignore
      const created = notiRepo.create({
        resource_type,
        resource_id,
        customer_id,
        to,
        data,
        event_name: event,
        noti_type,
        provider_id: providerId,
      }) as Notification

      const newNoti = (await notiRepo.save(created)) as Notification

      // emit event notification created
      if (
        newNoti.noti_type === NotificationType.NOTIFICATION &&
        newNoti.customer_id
      ) {
        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(NotificationService.Events.CREATED, { id: newNoti.id })
      }

      return newNoti
    })
  }

  async listAndCount(
    selector: Selector<Notification>,
    config: FindConfig<Notification> = {
      skip: 0,
      take: 50,
      order: { created_at: 'DESC' },
    },
  ): Promise<[Notification[], number]> {
    const notiRepo = this.manager_.getCustomRepository(
      this.notificationRepository_,
    )
    const query = buildQuery(selector, config)

    // @ts-ignore
    return await notiRepo.findAndCount(query)
  }
}
