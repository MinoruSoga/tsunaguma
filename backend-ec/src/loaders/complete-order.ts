/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import dayjs from 'dayjs'
import { MedusaContainer } from 'medusa-extender'
import { IsNull, LessThanOrEqual, Not } from 'typeorm'

import { ORDER_COMPLETE_DURATION } from '../helpers/constant'
import { EventBusService } from '../modules/event/event-bus.service'
import { OrderService } from '../modules/order/services/order.service'

const completeOrder = async (container: MedusaContainer, options) => {
  const logger = container.resolve<Logger>('logger')

  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')
    // removing old crob job handlers

    eventBusService.createCronJob(
      'complete-order',
      {},
      '0 0 * * *', // every day at midnight
      async () => {
        // job to schedule
        const orderService = container.resolve<OrderService>('orderService')
        const today = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')

        // payment status === captured
        // fulfillment_status === shipped
        // cancel_status === null
        // status === pending

        const comparedDate = new Date(Date.now() - ORDER_COMPLETE_DURATION)
        const fromDay = dayjs(comparedDate).format('YYYY-MM-DD HH:mm:ss')

        const orders = await orderService.list(
          {
            payment_status: PaymentStatus.CAPTURED,
            fulfillment_status: FulfillmentStatus.SHIPPED,
            // @ts-ignore
            cancel_status: IsNull(),
            parent_id: Not(IsNull()),
            status: OrderStatus.PENDING,
            shipped_at: LessThanOrEqual(comparedDate),
          },
          {
            select: [
              'id',
              'payment_status',
              'fulfillment_status',
              'status',
              'shipped_at',
              'display_id',
            ],
          },
        )

        logger.debug(
          'Processing auto complete order at ' +
            today +
            ' with total count: ' +
            orders.length,
        )
        logger.info(
          'Orders which were shipped from ' + fromDay + ' will be complete!',
        )

        await Promise.all(
          orders.map(async (order) => {
            await orderService.completeOrder(order.id)
          }),
        )
      },
    )
  } catch (error) {
    logger.error(error)
  }
}

export default completeOrder
