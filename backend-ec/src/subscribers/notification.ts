import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { EntityManager } from 'typeorm'

import { CampaignRequestService } from '../modules/campaign-request/service/campaign-request.service'
import DeliveryRequestService from '../modules/delivery-request/services/delivery-request.service'
import { InquiryService } from '../modules/inquiries-contact/inquiry.service'
import { OrderService } from '../modules/order/services/order.service'
import { PointService } from '../modules/point/services/point.service'
import { ProductSaleService } from '../modules/product/services/product-sale.service'
import { RestockRequestService } from '../modules/product/services/restock-request.service'
import { ReturnService } from '../modules/return/service/return.service'
import { ReturnDeliveryService } from '../modules/return-delivery/service/return-delivery.service'
import StoreService from '../modules/store/services/store.service'
import CustomerService from '../modules/user/services/customer.service'
import UserService from '../modules/user/services/user.service'
import WithdrawalService from '../modules/user/services/withdrawal.service'
import UserRepository from '../modules/user/user.repository'
import EmailSenderService from '../services/email-sender.service'
import NotificationManagerService from '../services/notification-manager.service'
import PusherService from '../services/pusher.service'
import { ChattingService } from './../modules/chatting/chatting.service'
import { FavoriteService } from './../modules/favorite/services/favorite.service'
import { NotificationService } from './../modules/notification/services/notification.service'
import { ProductReviewsService } from './../modules/product/services/product-reviews.service'

type InjectedDependencies = {
  notificationService: NotificationService
  eventBusService: EventBusService
  logger: Logger
  userRepository: typeof UserRepository
  manager: EntityManager
}

export default class NotificationSubscriber {
  private eventBus_: EventBusService
  private logger_: Logger
  private pusherService_: PusherService
  private notificationService_: NotificationService
  private userRepo_: typeof UserRepository
  private manager: EntityManager

  constructor({
    notificationService,
    eventBusService,
    logger,
    userRepository,
    manager,
  }: InjectedDependencies) {
    this.eventBus_ = eventBusService
    this.pusherService_ = new PusherService()
    this.logger_ = logger
    this.notificationService_ = notificationService
    this.userRepo_ = userRepository
    this.manager = manager

    // done
    notificationService.subscribe(
      UserService.Events.REGISTERED,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      UserService.Events.PASSWORD_RESET,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      InquiryService.Events.CREATED,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      UserService.Events.UPDATED_LOGIN_INFO,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      UserService.Events.UPDATED_LOGIN_INFO_PASSWORD,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      CustomerService.Events.CREATED,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      StoreService.Events.CREATED,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      UserService.Events.PASSWORD_RESET_COMPLETE,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      OrderService.Events.SETTLED,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      OrderService.Events.REQUEST_CANCEL,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      OrderService.Events.CANCEL_COMPLETE,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      OrderService.Events.SHIPMENT_COMPLETE,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      ProductReviewsService.Events.PRODUCT_REVIEW,
      NotificationManagerService.identifier,
    )

    notificationService.subscribe(
      FavoriteService.Events.FOLLOW_SHOP,
      NotificationManagerService.identifier,
    )

    // done
    notificationService.subscribe(
      FavoriteService.Events.LIKE_PRODUCT,
      NotificationManagerService.identifier,
    )

    notificationService.subscribe(
      ChattingService.Events.RECEIVE_MESSAGE,
      NotificationManagerService.identifier,
    )

    notificationService.subscribe(
      ChattingService.Events.SEND_CHAT_MAIL,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      OrderService.Events.SETTLED_SHOP,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      OrderService.Events.ORDER_RETURN_REQUESTED,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      RestockRequestService.Events.RESTOCK_REQUEST_SHOP,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      RestockRequestService.Events.RESTOCK_REQUEST_USER,
      EmailSenderService.identifier,
    )

    // done
    notificationService.subscribe(
      RestockRequestService.Events.RESTOCK_VARIANT_ANNOUNCE,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      StoreService.Events.PHOTO_SERVICE_COMPLETE,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      StoreService.Events.RETURN_GUARANTEE_COMPLETE,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      ProductSaleService.Events.PRODUCT_SALE,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      WithdrawalService.Events.CREATED,
      EmailSenderService.identifier,
    )

    this.eventBus_.subscribe(
      NotificationService.Events.CREATED,
      this.handleNotificationCreated.bind(this),
    )

    notificationService.subscribe(
      DeliveryRequestService.Events.SEND_MAIL,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      DeliveryRequestService.Events.QUANTITY_CONFIRM,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      DeliveryRequestService.Events.ARRIVED,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      DeliveryRequestService.Events.PUBLISHED,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      ProductReviewsService.Events.REVIEW_MAIL,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      OrderService.Events.CANCEL_COMPLETE_SHOP,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      ReturnService.Events.RECEIVE,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      ReturnDeliveryService.Events.REQUESTED,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      ReturnDeliveryService.Events.SHIPPED,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      PointService.Events.CUSTOMER_EXPIRE_POINT,
      EmailSenderService.identifier,
    )

    notificationService.subscribe(
      CampaignRequestService.Events.CREATE,
      EmailSenderService.identifier,
    )
  }

  async handleNotificationCreated({ id }: { id: string }) {
    try {
      const userRepo = this.manager.getCustomRepository(this.userRepo_)
      const notification = await this.notificationService_.retrieve(id)

      if (!notification.customer_id) return

      const notificationTo = notification.customer_id
      this.logger_.debug(
        `Send notification by PUSHER to user: ${notificationTo} ==> ` +
          notification,
      )

      await userRepo.increment({ id: notificationTo }, 'new_noti_cnt', 1)
      await this.pusherService_.pushTrigger_(
        notificationTo,
        NotificationService.Events.CREATED,
        notification,
      )
    } catch (error) {
      this.logger_.error(error)
    }
  }
}
