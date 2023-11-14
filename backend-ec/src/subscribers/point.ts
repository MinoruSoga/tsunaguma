/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  defaultStoreOrdersFields,
  defaultStoreOrdersRelations,
} from '@medusajs/medusa'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { EntityManager } from 'typeorm'

import loadConfig from '../helpers/config'
import { REGISTRATION_REWARD_POINT } from '../helpers/constant'
import { convertMoneyToPoint } from '../helpers/point'
import { OrderService } from '../modules/order/services/order.service'
import CustomerService from '../modules/user/services/customer.service'
import UserService from '../modules/user/services/user.service'
import NotificationManagerService from '../services/notification-manager.service'
import {
  Discount,
  DiscountType,
} from './../modules/discount/entities/discount.entity'
import { DiscountService } from './../modules/discount/services/discount.service'
import { NotificationType } from './../modules/notification/entities/notification.entity'
import { NotificationService } from './../modules/notification/services/notification.service'
import { Order } from './../modules/order/entity/order.entity'
import { PointService } from './../modules/point/services/point.service'

type InjectionDependencies = {
  manager: EntityManager
  orderService: OrderService
  logger: Logger
  eventBusService: EventBusService
  pointService: PointService
  discountService: DiscountService
  userService: UserService
  notificationService: NotificationService
}

type ShipmentCompleteData = {
  id: string
  parent_id?: string
}

type OrderEventData = {
  id: string
  data: {
    order: Order
  }
}

class PointSubscriber {
  private manager: EntityManager
  private orderService: OrderService
  private logger: Logger
  private eventBusService: EventBusService
  private pointService: PointService
  private discountService: DiscountService
  private notificationService: NotificationService
  private userService: UserService

  constructor(container: InjectionDependencies) {
    this.manager = container.manager
    this.orderService = container.orderService
    this.logger = container.logger
    this.eventBusService = container.eventBusService
    this.pointService = container.pointService
    this.discountService = container.discountService
    this.notificationService = container.notificationService
    this.userService = container.userService

    // subscribe point events
    this.eventBusService.subscribe(
      OrderService.Events.COMPLETED,
      this.handleOrderComplete.bind(this),
    )

    this.eventBusService.subscribe(
      CustomerService.Events.CREATED,
      this.handleCustomerCreated.bind(this),
    )

    // Order cancellation is not allowed after 14 days after shipping notification and will not affect the points awarded.
    this.eventBusService.subscribe(
      OrderService.Events.CANCEL_COMPLETE,
      this.handleRefundPoint.bind(this),
    )

    // subscribe to send notification related to points event
    this.notificationService.subscribe(
      PointService.Events.REWARD_POINT,
      NotificationManagerService.identifier,
    )
  }

  async handleOrderComplete({ id }: ShipmentCompleteData) {
    await this.manager.transaction(async (transactionManager) => {
      this.logger.debug('Shipping of order with id ' + id + ' completed!!!')
      // TODO: reward point for purchasing base on subtotal of order
      //retrieve order
      const order = (await this.orderService.retrieveDetail(id, {
        // @ts-ignore
        select: defaultStoreOrdersFields.concat([
          'cancel_status',
          'parent_id',
          'metadata',
        ]),
        relations: defaultStoreOrdersRelations.concat([
          'items.line_item_addons',
          'items.line_item_addons.lv1',
          'items.line_item_addons.lv2',
          'items.shipping_method',
          'store',
        ]),
      })) as Order

      // only for children order
      if (!order.parent_id || order.subtotal === 0) return

      // const pointDiscount = order.discounts.find(
      //   (discount: Discount) => discount.type === DiscountType.POINT,
      // )
      // if (pointDiscount) {
      // const usedPoint = pointDiscount.rule.value || 0
      // const gainedPoint = convertMoneyToPoint(
      //   order.subtotal - convertPointToMoney(usedPoint),
      // )
      const gainedPoint = convertMoneyToPoint(order.subtotal)
      await this.pointService.withTransaction(transactionManager).create({
        amount: gainedPoint,
        user_id: order.customer_id,
        message: `${order.display_id}T:${order.store.name}購入`,
        id: `${order.id}-${order.customer_id}-order_complete`,
      })

      const config = loadConfig()
      const user = await this.userService.retrieve(
        order.customer_id,
        {
          select: ['id', 'avatar'],
        },
        false,
      )

      // send notification to the user
      await this.pointService.sendNotification(
        order.customer_id,
        PointService.Events.REWARD_POINT,
        {
          id: order.customer_id,
          customer_id: order.customer_id,
          type: NotificationType.NOTIFICATION,
          message: `${gainedPoint}ポイントをお贈りしました`,
          link: config.frontendUrl.pointList,
          avatar: user.avatar,
        },
      )
      // }
    })
  }

  // after new registration, create point total for new customer
  // and reward 1000 point to new customer
  async handleCustomerCreated({ id }: { id: string }) {
    // check if this user already register with this email or not (withdraw)
    const isReRegisterd = await this.userService.isReRegister(id)

    if (isReRegisterd) return

    // TODO: reward 1000 point for new registraton
    await this.pointService.create({
      amount: REGISTRATION_REWARD_POINT,
      user_id: id,
      message: '会員登録キャンペーン   ポイント付与',
      id: `${id}-registration_complete`,
    })

    const config = loadConfig()
    const user = await this.userService.retrieve(id, {
      select: ['id', 'avatar'],
    })

    // send notification to the user
    await this.pointService.sendNotification(
      id,
      PointService.Events.REWARD_POINT,
      {
        id,
        customer_id: id,
        type: NotificationType.NOTIFICATION,
        message: `会員登録キャンペーン`,
        link: config.frontendUrl.pointList,
        avatar: user.avatar,
      },
    )
  }

  async handleRefundPoint({ data: { order } }: OrderEventData) {
    const pointDiscount = order.discounts?.find(
      (discount: Discount) => discount.type === DiscountType.POINT,
    )

    if (!pointDiscount) return

    const amountToRefund = pointDiscount.rule.value
    await this.pointService.create({
      amount: amountToRefund,
      user_id: order.customer_id,
      message: `注文キャンセル　ポイント返還 注文ID： ${order.display_id}T`,
      id: `${order.id}-${order.customer_id}-order_cancel_complete`,
    })

    const config = loadConfig()
    const user = await this.userService.retrieve(order.customer_id, {
      select: ['id', 'avatar'],
    })

    // send notification to the user
    await this.pointService.sendNotification(
      order.customer_id,
      PointService.Events.REWARD_POINT,
      {
        id: order.customer_id,
        customer_id: order.customer_id,
        type: NotificationType.NOTIFICATION,
        amount: amountToRefund,
        message: `${amountToRefund}ポイントをお贈りしました`,
        link: config.frontendUrl.pointList,
        avatar: user.avatar,
      },
    )
  }
}

export default PointSubscriber
