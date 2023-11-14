import { Module } from 'medusa-extender'

import {
  ExtendedAdminPostProductReq,
  ExtendedAdminPostProductVariantsReq,
  ExtendedProductVariantPricesCreateReq,
} from './controllers/create-product.admin.controller'
import { ExtendedAdminPostProductsProductReq } from './controllers/update-product.admin.controller'
import { Image } from './entity/image.entity'
import { Product } from './entity/product.entity'
import { ProductAddons } from './entity/product-addons.entity'
import { ProductColor } from './entity/product-color.entity'
import { ProductColors } from './entity/product-colors.entity'
import { ProductHistory } from './entity/product-history.entity'
import { ProductImages } from './entity/product-images.entity'
import { ProductMaterial } from './entity/product-material.entity'
import { ProductReaction } from './entity/product-reaction.entity'
import { ProductReviews } from './entity/product-reviews.entity'
import { ProductShippingOptions } from './entity/product-shipping-options.entity'
import { ProductSize } from './entity/product-size.entity'
import { ProductSpec } from './entity/product-spec.entity'
import { ProductSpecs } from './entity/product-specs.entity'
import { ProductType } from './entity/product-type.entity'
import { ProductVariant } from './entity/product-variant.entity'
import { RestockRequest } from './entity/restock-request.entity'
import AttachImageSubscribersMiddleware from './middlewares/image.middleware'
import AttachProductSubscribersMiddleware from './middlewares/product.middleware'
import { ProductMigration1667150651362 } from './migrations/1667150651362-product.migration'
import { ProductMigration1667157190784 } from './migrations/1667157190784-product.migration'
import { ProductMigration1667356666463 } from './migrations/1667356666463-product.migration'
import { ProductMigration1667535387251 } from './migrations/1667535387251-product.migration'
import { ProductMigration1667834578169 } from './migrations/1667834578169-product.migration'
import { ProductMigration1668075510559 } from './migrations/1668075510559-product.migration'
import { ProductMigration1668095374220 } from './migrations/1668095374220-product.migration'
import { ProductMigration1668329643314 } from './migrations/1668329643314-product.migration'
import { ProductMigration1668394761562 } from './migrations/1668394761562-product.migration'
import { ProductMigration1668619991953 } from './migrations/1668619991953-product.migration'
import { ProductMigration1670562256905 } from './migrations/1670562256905-product.migration'
import { ProductMigration1671077415439 } from './migrations/1671077415439-product.migration'
import { ProductMigration1671535135941 } from './migrations/1671535135941-product.migration'
import { ProductMigration1672238352378 } from './migrations/1672238352378-product.migration'
import { ProductMigration1673089283580 } from './migrations/1673089283580-product.migration'
import { ProductMigration1673177557217 } from './migrations/1673177557217-product.migration'
import { ProductMigration1673349767298 } from './migrations/1673349767298-product.migration'
import { ProductMigration1675073176545 } from './migrations/1675073176545-product.migration'
import { ProductMigration1675767794776 } from './migrations/1675767794776-product.migration'
import { ProductMigration1675913461823 } from './migrations/1675913461823-product.migration'
import { ProductMigration1676605246523 } from './migrations/1676605246523-product.migration'
import { ProductMigration1676706870074 } from './migrations/1676706870074-product.migration'
import { ProductMigration1677164527313 } from './migrations/1677164527313-product.migration'
import { ProductMigration1678005684936 } from './migrations/1678005684936-product.migration'
import { ProductMigration1678269237126 } from './migrations/1678269129380-product.migration'
import { ProductMigration1678282143235 } from './migrations/1678282143235-product.migration'
import { ProductMigration1682064783437 } from './migrations/1682064783437-product.migration'
import { ProductMigration1684747989541 } from './migrations/1684747989541-product.migration'
import { ProductMigration1685074945775 } from './migrations/1685074945775-product.migration'
import { ProductMigration1694071307906 } from './migrations/1694071307906-product.migration'
import { ProductMigration1698831271897 } from './migrations/1698831271897-product.migration'
import { ProductShippingOptionsMigration1699328499391 } from './migrations/1699328499391-ProductShippingOptions.migration'
import { ProductRouter } from './product.router'
import ProductRepository from './repository/product.repository'
import { ProductAddonsRepository } from './repository/product-addons.repository'
import { ProductColorRepository } from './repository/product-color.repository'
import { ProductColorsRepository } from './repository/product-colors.repository'
import { ProductHistoryRepository } from './repository/product-history.repository'
import { ProductImagesRepository } from './repository/product-images.repository'
import { ProductMaterialRepository } from './repository/product-material.repository'
import { ProductReviewsRepository } from './repository/product-reviews.repository'
import { ProductShippingOptionsRepository } from './repository/product-shipping-options.repository'
import { ProductSizeRepository } from './repository/product-size.repository'
import { ProductSpecRepository } from './repository/product-spec.repository'
import { ProductSpecsRepository } from './repository/product-specs.repository'
import ProductTypeRepository from './repository/product-type.repository'
import { ProductVariantRepository } from './repository/product-variant.repository'
import { RestockRequestRepository } from './repository/restock-request.repository'
import { PriceListService } from './services/price-list.service'
import { ProductService } from './services/product.service'
import { ProductAddonsService } from './services/product-addons.service'
import { ProductColorService } from './services/product-color.service'
import { ProductHistoryService } from './services/product-history.service'
import { ProductMaterialService } from './services/product-material.service'
import { ProductReviewsService } from './services/product-reviews.service'
import { ProductSaleService } from './services/product-sale.service'
import { ProductSearchCmsService } from './services/product-search-cms.service'
import { ProductSizeService } from './services/product-size.service'
import { ProductSortService } from './services/product-sort.service'
import { ProductSpecService } from './services/product-spec.service'
import { ProductTypeService } from './services/product-type.service'
import { ProductVariantService } from './services/product-variant.service'
import { RestockRequestService } from './services/restock-request.service'
import { ProductSaleSubscriber } from './subscribers/product-sale.subscriber'
import { ProductSortSubscriber } from './subscribers/product-sort.subscriber'
import { RestockRequestSubcribe } from './subscribers/restock-request.subscriber'

@Module({
  imports: [
    Product,
    ProductReviewsService,
    ProductRepository,
    ProductService,
    ProductVariantService,
    AttachImageSubscribersMiddleware,
    AttachProductSubscribersMiddleware,
    ProductType,
    ProductMaterial,
    Image,
    ProductSpec,
    ProductSpecs,
    ProductSize,
    ProductAddons,
    ProductColor,
    ProductMigration1667150651362,
    ProductMigration1667157190784,
    ProductMigration1667356666463,
    ProductMigration1667535387251,
    ProductMigration1667834578169,
    ProductMigration1668075510559,
    ProductMigration1668095374220,
    ProductMigration1668329643314,
    ProductMigration1668394761562,
    ProductMigration1670562256905,
    ProductHistoryService,
    ProductColors,
    ProductReaction,
    ProductReviews,
    ProductTypeService,
    ProductTypeRepository,
    ProductShippingOptions,
    ProductShippingOptionsRepository,
    ProductSpecService,
    ProductSpecRepository,
    ProductSizeRepository,
    ProductSizeService,
    ProductColorRepository,
    ProductColorService,
    ProductMaterialService,
    ProductSortService,
    ProductMaterialRepository,
    ExtendedAdminPostProductReq,
    ExtendedProductVariantPricesCreateReq,
    ExtendedAdminPostProductVariantsReq,
    ExtendedAdminPostProductsProductReq,
    ProductRouter,
    ProductAddonsRepository,
    ProductAddonsService,
    ProductImages,
    ProductImagesRepository,
    ProductColorsRepository,
    ProductSpecsRepository,
    ProductMigration1668619991953,
    ProductReviewsRepository,
    ProductHistoryRepository,
    ProductHistory,
    ProductSortSubscriber,
    ProductMigration1671077415439,
    ProductMigration1671535135941,
    ProductMigration1672238352378,
    ProductMigration1673089283580,
    ProductMigration1673177557217,
    ProductMigration1673349767298,
    ProductMigration1675073176545,
    ProductMigration1675767794776,
    ProductMigration1675913461823,
    ProductMigration1676605246523,
    ProductMigration1676706870074,
    ProductMigration1677164527313,
    ProductMigration1678005684936,
    ProductMigration1685074945775,
    RestockRequestRepository,
    RestockRequest,
    RestockRequestService,
    ProductMigration1678269237126,
    ProductMigration1678282143235,
    ProductSearchCmsService,
    RestockRequestSubcribe,
    ProductSaleSubscriber,
    ProductSaleService,
    PriceListService,
    ProductVariant,
    ProductMigration1682064783437,
    ProductMigration1684747989541,
    ProductVariantRepository,
    ProductMigration1694071307906,
    ProductMigration1698831271897,
    ProductShippingOptionsMigration1699328499391
  ],
})
export class ProductModule {}
