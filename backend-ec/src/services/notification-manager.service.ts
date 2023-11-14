import { AbstractNotificationService } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { EntityManager } from 'typeorm'

import { ChattingService } from './../modules/chatting/chatting.service'
import { FavoriteService } from './../modules/favorite/services/favorite.service'
import { PointService } from './../modules/point/services/point.service'
import { ProductReviewsService } from './../modules/product/services/product-reviews.service'

type InjectedDependencies = {
  pointService: PointService
  favoriteService: FavoriteService
  productReviewsService: ProductReviewsService
  chattingService: ChattingService
  logger: Logger
  manager: EntityManager
}

type NotificationDataParams = {
  customer_id: string
  message: string
  id: string
}

export default class NotificationManagerService extends AbstractNotificationService {
  static identifier = 'notification-manager'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  private container: InjectedDependencies

  private logger: Logger

  constructor(container: InjectedDependencies) {
    super(container)
    this.container = container
    this.logger = container.logger
    this.manager_ = container.manager
  }

  async sendNotification(
    event: string,
    data: NotificationDataParams,
  ): Promise<{ to: string; status: string; data: any }> {
    this.logger.debug(
      `[NotificationManagerService]: Add notification event:: ${event} to user:: ${
        data.customer_id
      } ==> with data: ${JSON.stringify(data)}`,
    )

    const handleService = await this.findService(event)
    const notificationData = await handleService?.genNotificationData(
      event,
      data,
    )

    if (!notificationData)
      return {
        to: event,
        status: 'failed',
        data,
      }

    return {
      to: notificationData.to,
      data: notificationData.data,
      status: 'success',
    }
  }
  async resendNotification(
    notification: unknown,
    config: unknown,
    attachmentGenerator: unknown,
  ): Promise<{ to: string; status: string; data: Record<string, unknown> }> {
    throw new Error('Method not implemented.')
  }

  async findService(event: string) {
    switch (event) {
      case PointService.Events.REWARD_POINT:
        return this.container.pointService
      case ProductReviewsService.Events.PRODUCT_REVIEW:
        return this.container.productReviewsService
      case FavoriteService.Events.FOLLOW_SHOP:
      case FavoriteService.Events.LIKE_PRODUCT:
        return this.container.favoriteService
      case ChattingService.Events.RECEIVE_MESSAGE:
        return this.container.chattingService

      default:
        return null
    }
  }
}
