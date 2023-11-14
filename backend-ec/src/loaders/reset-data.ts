/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaContainer } from 'medusa-extender'

import { CacheService } from '../modules/cache/cache.service'
import { EventBusService } from '../modules/event/event-bus.service'
import { ProductSearchService } from '../modules/search/services/product-search.service'

export default async (container: MedusaContainer) => {
  const logger = container.resolve<Logger>('logger')
  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')
    // removing old crob job handlers

    eventBusService.createCronJob(
      'reset-data',
      {},
      '0 0 * * SAT', // every saturday at midnight
      async () => {
        // job to schedule
        const cacheService = container.resolve<CacheService>('cacheService')

        // clear redis cache of all metadata
        logger.info('Clear cache of metadata')
        await cacheService.clearCache([
          'product-specs*',
          'product-colors*',
          'product-materials*',
          'product-sizes*',
          'product-types*',
          'prefectures*',
        ])

        // soft-reset meilisearch data
        logger.info('Soft reset meilisearch data')
        await eventBusService.emit(
          ProductSearchService.TNG_SEARCH_INDEX_EVENT,
          {},
        )
      },
    )
  } catch (error) {
    logger.error(error)
  }
}
