import { BatchJobService } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { request } from 'express'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { EventBusService } from '../modules/event/event-bus.service'
import { UserType } from '../modules/user/entity/user.entity'
import UserService from '../modules/user/services/user.service'

const promoCodeGen = async (container: MedusaContainer) => {
  const logger = container.resolve<Logger>('logger')
  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')
    // removing old crob job handlers

    eventBusService.createCronJob(
      'promo-code-gen',
      {},
      '1 1 1 * *',
      async () => {
        const userService: UserService = container.resolve('userService')

        const batchJobService: BatchJobService =
          container.resolve('batchJobService')

        const manager: EntityManager = container.resolve('manager')

        const promo_code_gen = {
          type: 'promo-code-gen',
          context: {},
          dry_run: false,
        }

        const user = await userService.listUserCms(
          { type: UserType.ADMIN_ADMIN },
          {
            take: 1,
            order: { created_at: 'ASC' },
          },
        )

        await manager.transaction(async (transactionManager) => {
          const toCreate = await batchJobService
            .withTransaction(transactionManager)
            .prepareBatchJobForProcessing(promo_code_gen, request)

          await batchJobService.withTransaction(transactionManager).create({
            ...toCreate,
            created_by: user[0]?.id,
          })
        })
      },
    )
  } catch (error) {
    logger.error(error)
  }
}

export default promoCodeGen
