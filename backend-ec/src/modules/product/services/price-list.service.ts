import {
  CustomerGroupService,
  PriceList,
  PriceListService as MedusaPriceListService,
  ProductVariant,
  RegionService,
} from '@medusajs/medusa'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { PriceListRepository } from '@medusajs/medusa/dist/repositories/price-list'
import { ProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Service } from 'medusa-extender'
import { EntityManager, FindManyOptions, In } from 'typeorm'

import ProductRepository from '../repository/product.repository'
import { ProductService } from './product.service'
import { ProductVariantService } from './product-variant.service'
dayjs.extend(utc)

type InjectedDependencies = {
  manager: EntityManager
  customerGroupService: CustomerGroupService
  regionService: RegionService
  productService: ProductService
  productVariantService: ProductVariantService
  moneyAmountRepository: typeof MoneyAmountRepository
  productVariantRepository: typeof ProductVariantRepository
  featureFlagRouter: FlagRouter
  priceListRepository: typeof PriceListRepository
  productRepository: typeof ProductRepository
}

@Service({ override: MedusaPriceListService })
export class PriceListService extends MedusaPriceListService {
  static resolutionKey = 'priceListService'
  protected container: InjectedDependencies
  protected readonly priceListRepo: typeof PriceListRepository
  protected readonly productRepo: typeof ProductRepository
  protected readonly productVariantRepo: typeof ProductVariantRepository

  private manager: EntityManager

  constructor(container: InjectedDependencies) {
    super(container)
    this.priceListRepo = container.priceListRepository
    this.productRepo = container.productRepository
    this.productVariantRepo = container.productVariantRepository
    this.container = container
    this.manager = container.manager
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): PriceListService {
    if (!transactionManager) {
      return this
    }

    const cloned = new PriceListService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.manager = transactionManager

    return cloned
  }

  async getProductSaleToday() {
    const priceListRepo = this.manager.getCustomRepository(this.priceListRepo)
    const productVariantRepo = this.manager.getCustomRepository(
      this.productVariantRepo,
    )
    // get price list have starts_at is today
    const today = dayjs()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .utc()
      .format('YYYY-MM-DD')

    const query = priceListRepo
      .createQueryBuilder('price_list')
      .where("to_char(starts_at, 'YYYY-MM-DD') = :today", { today })
    const priceListToday = await query.getMany()

    if (priceListToday.length <= 0) {
      return []
    }
    // get product id list
    const variantIds = priceListToday.map((priceList) => priceList.name)
    const qb: FindManyOptions<ProductVariant> = buildQuery(
      {
        id: In(variantIds),
      },
      { relations: ['prices'] },
    )
    const productSaleToday = await productVariantRepo.find(qb)
    const productIds: { product_id: string; amount: number }[] = []
    productSaleToday.map((variant) => {
      const duplicateProduct = productIds.find(
        (product) => product.product_id === variant.product_id,
      )
      if (!duplicateProduct) {
        productIds.push({
          product_id: variant.product_id,
          amount: variant.prices.find((price) => price.price_list_id !== null)
            .amount,
        })
      }
    })
    return productIds
  }

  async retrieve_(
    priceListId: string,
    config: FindConfig<PriceList> = {},
  ): Promise<PriceList> {
    const priceListRepo = this.manager_.getCustomRepository(this.priceListRepo_)

    const query = buildQuery({ id: priceListId }, config)
    const priceList = await priceListRepo.findOne(query)

    return priceList
  }
}
