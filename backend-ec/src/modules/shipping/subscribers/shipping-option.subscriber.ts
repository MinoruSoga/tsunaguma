/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Subscriber } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { CacheService } from '../../cache/cache.service'
import { ProductShippingOptionsRepository } from '../../product/repository/product-shipping-options.repository'
import { ProductService } from '../../product/services/product.service'
import { ShippingOptionService } from '../services/shipping-option.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  logger: Logger
  shippingOptionService: ShippingOptionService
  productService: ProductService
  manager: EntityManager
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  cacheService: CacheService
}

@Subscriber()
export class ShippingOptionSubscriber {
  private logger_: Logger
  private manager: EntityManager
  protected optionService_: ShippingOptionService
  protected productService_: ProductService
  protected cacheService_: CacheService
  protected productShippingOptionRepo_: typeof ProductShippingOptionsRepository

  constructor(container: InjectedDependencies) {
    this.logger_ = container.logger
    this.manager = container.manager
    this.cacheService_ = container.cacheService
    this.productService_ = container.productService
    this.productShippingOptionRepo_ = container.productShippingOptionsRepository

    // shipping option updated
    container.eventBusService.subscribe(
      ShippingOptionService.Events.UPDATE,
      this.handleShippingOptionUpdate.bind(this),
    )
  }

  async handleShippingOptionUpdate({ id }: { id: string }) {
    try {
      const productShippingOptionRepo = this.manager.getCustomRepository(
        this.productShippingOptionRepo_,
      )
      this.logger_.debug('Shipping option update with id ' + id)
      const options = await productShippingOptionRepo.find({
        shipping_option_id: id,
      })

      const invalidatedIds = options.map((o) => o.product_id)

      await Promise.all(
        invalidatedIds.map(async (productId) => {
          await this.cacheService_.invalidate(`prod-detail-${productId}`)
        }),
      )
    } catch (error) {
      this.logger_.error(error)
    }
  }
}
