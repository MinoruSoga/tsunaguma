/* eslint-disable @typescript-eslint/ban-ts-comment */
import { OrderStatus } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import dayjs from 'dayjs'
import { MedusaContainer } from 'medusa-extender'
import { IsNull, Not } from 'typeorm'

import { EventBusService } from '../modules/event/event-bus.service'
import { OrderService } from '../modules/order/services/order.service'

const capturePrice = async (container: MedusaContainer) => {
  const logger = container.resolve<Logger>('logger')

  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')
    // removing old crob job handlers

    eventBusService.createCronJob(
      'capture-price',
      {},
      '35 0 09 06 *',
      async () => {
        const orderService = container.resolve<OrderService>('orderService')
        const today = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')

        const orders = await orderService.list(
          {
            // @ts-ignore
            parent_id: Not(IsNull()),
            status: Not(OrderStatus.CANCELED),
          },
          {
            select: ['id', 'metadata'],
          },
        )

        logger.debug(
          'Processing auto capture price and shipping price order at ' +
            today +
            ' with total count: ' +
            orders.length,
        )

        for (const order of orders) {
          if (!order?.metadata?.price) {
            await orderService.setPriceMetadata(order)
          }
          if (
            !order?.metadata?.shipping_total ||
            !order?.metadata?.item_total
          ) {
            await orderService.setLineItem(order)
          }
        }

        logger.info(
          'Processing auto capture price and shipping price order at ' +
            today +
            ' completed!',
        )
      },
    )
  } catch (error) {
    logger.error(error)
  }
}

export default capturePrice
