process.env.TZ = 'Asia/Tokyo'

import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaContainer } from 'medusa-extender'
import { ProductSaleService } from 'src/modules/product/services/product-sale.service'

import { EventBusService } from '../modules/event/event-bus.service'
import { PriceListService } from '../modules/product/services/price-list.service'

const productSale = (container: MedusaContainer) => {
  const logger = container.resolve<Logger>('logger')
  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')
    // 2 am every day
    eventBusService.createCronJob(
      'product-sale',
      {},
      '0 10 * * *',
      async () => {
        const priceListService =
          container.resolve<PriceListService>('priceListService')
        const productSaleService =
          container.resolve<ProductSaleService>('productSaleService')
        const productIds = await priceListService.getProductSaleToday()

        Promise.all(
          productIds.map(async (product) => {
            await productSaleService.sendEmailProductLiked(
              product.product_id,
              product.amount,
            )
            logger.info(
              `Send email for users who like product with id::${product.product_id}`,
            )
          }),
        )
      },
    )
  } catch (error) {
    logger.error(error)
  }
}

export default productSale
