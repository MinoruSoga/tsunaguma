/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Subscriber } from 'medusa-extender'

import { ProductVariantService } from '../services/product-variant.service'
import { RestockRequestService } from '../services/restock-request.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  logger: Logger
  productVariantService: ProductVariantService
  restockRequestService: RestockRequestService
}

@Subscriber()
export class RestockRequestSubcribe {
  private logger_: Logger
  protected productVariantService_: ProductVariantService
  protected restockRequestService_: RestockRequestService

  constructor(container: InjectedDependencies) {
    this.logger_ = container.logger
    this.productVariantService_ = container.productVariantService
    this.restockRequestService_ = container.restockRequestService

    container.eventBusService.subscribe(
      ProductVariantService.Events.UPDATED,
      this.handleProductVariantRestock.bind(this),
    )
  }
  async handleProductVariantRestock(data) {
    await this.restockRequestService_.handleRestockRequestComplete({
      product_id: data.product_id,
      variant_id: data.id,
    })
  }
}
