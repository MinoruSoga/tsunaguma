/* eslint-disable @typescript-eslint/ban-ts-comment */
process.env.TZ = 'Asia/Tokyo'

import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaContainer } from 'medusa-extender'

import { EventBusService } from '../modules/event/event-bus.service'
import { PointService } from '../modules/point/services/point.service'

const pointExpired = async (container: MedusaContainer) => {
  const logger = container.resolve<Logger>('logger')

  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')
    // removing old crob job handlers

    eventBusService.createCronJob(
      'point-expired',
      {},
      '30 12 * * *',
      async () => {
        // job to schedule
        const pointService = container.resolve<PointService>('pointService')

        const data = await pointService.getListPointExpiredNextWeek()

        if (!data) {
          return
        }

        const userIds = Array.from(data.map((e) => e.user_id))

        for (const i of userIds) {
          await pointService.sendMailPointExpired(i)
        }
      },
    )
  } catch (error) {
    logger.error(error)
  }
}

export default pointExpired
