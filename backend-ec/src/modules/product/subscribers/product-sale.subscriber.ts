import { MoneyAmount } from '@medusajs/medusa'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Subscriber } from 'medusa-extender'

import { ExtendedProductVariantPricesCreateReq } from '../controllers/create-product.admin.controller'
import { ProductSaleService } from '../services/product-sale.service'
import { ProductVariantService } from '../services/product-variant.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  logger: Logger
  productVariantService: ProductVariantService
  productSaleService: ProductSaleService
}

@Subscriber()
export class ProductSaleSubscriber {
  private logger_: Logger
  protected productVariantService_: ProductVariantService
  protected productSaleService_: ProductSaleService

  constructor(container: InjectedDependencies) {
    this.logger_ = container.logger
    this.productVariantService_ = container.productVariantService
    this.productSaleService_ = container.productSaleService

    container.eventBusService.subscribe(
      ProductSaleService.Events.UPDATE_SALE_PRICE,
      this.handleProductSale.bind(this),
    )
  }

  handleProductSale = async (data: {
    id: string
    product_id: string
    currentMoneyAmount: MoneyAmount
    newPriceList: ExtendedProductVariantPricesCreateReq[]
  }) => {
    await this.productSaleService_.handleProductSale({
      productId: data.product_id,
      currentMoneyAmount: data.currentMoneyAmount,
      newPriceList: data.newPriceList,
    })
  }
}
