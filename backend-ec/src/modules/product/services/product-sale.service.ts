import { EventBusService, MoneyAmount } from '@medusajs/medusa'
import { Service } from 'medusa-extender'
import { EntityManager, IsNull, Not } from 'typeorm'

import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import { ProductFavoriteRepository } from '../../favorite/repository/product-favorite.repository'
import { FavoriteService } from '../../favorite/services/favorite.service'
import { ExtendedProductVariantPricesCreateReq } from '../controllers/create-product.admin.controller'

type ConstructorParams = {
  manager: EntityManager
  favoriteService: FavoriteService
  productFavoriteRepository: typeof ProductFavoriteRepository
  eventBusService: EventBusService
}

interface ProductSaleEmailData {
  id: string
  format: string
  email: string
  data: object
}

@Service()
export class ProductSaleService implements IEmailTemplateDataService {
  readonly manager: EntityManager
  protected productFavoriteRepository_: typeof ProductFavoriteRepository
  protected transactionManager_: EntityManager | undefined
  protected readonly eventBus_: EventBusService
  static resolutionKey = 'productSaleService'

  static Events = {
    PRODUCT_SALE: 'send-product-sale',
    UPDATE_SALE_PRICE: 'update-sale-price',
  }

  constructor(private readonly container: ConstructorParams) {
    this.container = container
    this.manager = container.manager
    this.eventBus_ = container.eventBusService
    this.transactionManager_ = container.manager
    this.productFavoriteRepository_ = container.productFavoriteRepository
  }

  async genEmailData(
    event: string,
    data: ProductSaleEmailData,
  ): Promise<EmailTemplateData> {
    return {
      to: data.email,
      format: data.format,
      data: data.data,
    }
  }

  isExpire(startDate: Date, endDate: Date) {
    const start = startDate ? new Date(startDate).getTime() : null
    const end = endDate ? new Date(endDate).getTime() : null
    const current = new Date().getTime()

    // Not set sale date
    if (!start && !end) return false

    // Set both start date and end date
    if (start && end) {
      if (start > end) return true
      if (start > current || end < current) {
        return true
      }
      return false
    }

    // Set only start date or end date
    if ((start && start > current) || (end && end < current)) {
      return true
    }
    return false
  }

  async handleProductSale(data: {
    productId: string
    currentMoneyAmount: MoneyAmount
    newPriceList: ExtendedProductVariantPricesCreateReq[]
  }) {
    const currentSalePrice = data?.currentMoneyAmount?.price_list
      ? data.currentMoneyAmount.amount
      : null
    const currentStartDate = data?.currentMoneyAmount?.price_list
      ? data.currentMoneyAmount.price_list.starts_at
      : null
    const currentEndDate = data?.currentMoneyAmount?.price_list
      ? data.currentMoneyAmount.price_list.ends_at
      : null
    const newSalePrice = data.newPriceList[1]?.amount
    const newStartDate = data.newPriceList[1]?.starts_at
    const newEndDate = data.newPriceList[1]?.ends_at

    // have sale before and not expire yet
    if (currentSalePrice && !this.isExpire(currentStartDate, currentEndDate)) {
      if (
        !newSalePrice ||
        newSalePrice === currentSalePrice ||
        this.isExpire(newStartDate, newEndDate)
      ) {
        return
      }
      // have sale before and expired
    } else if (
      currentSalePrice &&
      this.isExpire(currentStartDate, currentEndDate)
    ) {
      if (!newSalePrice || this.isExpire(newStartDate, newEndDate)) {
        return
      }
    }
    // haven't sale before
    if (!currentSalePrice) {
      if (!newSalePrice || this.isExpire(newStartDate, newEndDate)) {
        return
      }
    }
    await this.sendEmailProductLiked(data.productId, newSalePrice)
  }

  async sendEmailProductLiked(productId: string, newSalePrice: number) {
    const productFavoriteRepo = this.manager.getCustomRepository(
      this.productFavoriteRepository_,
    )
    const usersLikeProduct = await productFavoriteRepo.find({
      where: { product_id: productId, user_id: Not(IsNull()) },
      relations: ['user', 'product'],
    })

    await Promise.all(
      usersLikeProduct.map(
        async (user) =>
          await this.eventBus_
            .withTransaction(this.transactionManager_)
            .emit(ProductSaleService.Events.PRODUCT_SALE, {
              id: user.user_id,
              email: user.user.email,
              format: 'send-email-product-sale',
              data: {
                product: user.product,
                nickname: user.user.nickname,
                salePrice: newSalePrice,
              },
            }),
      ),
    )
  }
}
