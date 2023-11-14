import { Module } from 'medusa-extender'

import { ViewedProduct } from './entity/viewed-product.entity'
import { Viewed_productMigration1670488679375 } from './migration/1670488679375-viewed_product.migration'
import { ViewedProductRepository } from './respository/viewed-product.repository'
import { ViewedProductRouter } from './viewed-product.router'
import { ViewedProductService } from './viewed-product.service'

@Module({
  imports: [
    ViewedProduct,
    ViewedProductRepository,
    ViewedProductService,
    Viewed_productMigration1670488679375,
    ViewedProductRouter,
  ],
})
export class ViewedProductModule {}
