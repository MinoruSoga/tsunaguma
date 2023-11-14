/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PriceSelectionContext, ProductStatus } from '@medusajs/medusa'
import {
  EventBusService,
  PricingService,
  ProductVariantService,
  SearchService,
} from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { indexTypes } from 'medusa-core-utils'
import { In, Not } from 'typeorm'

import { JAPANESE_CURRENCY_CODE } from '../helpers/constant'
import { CacheService } from '../modules/cache/cache.service'
import { Product } from '../modules/product/entity/product.entity'
import { ProductVariant } from '../modules/product/entity/product-variant.entity'
import { ProductService } from '../modules/product/services/product.service'
import StoreService from '../modules/store/services/store.service'
import { GiftCoverEnum } from './../modules/product/entity/product.entity'
import { ProductSearchService } from './../modules/search/services/product-search.service'
import {
  Store,
  StorePlanType,
  StoreStatus,
} from './../modules/store/entity/store.entity'

const searchFields: any = [
  'id',
  'title',
  'subtitle',
  'status',
  'description',
  'handle',
  'is_giftcard',
  'discountable',
  'thumbnail',
  // 'profile_id',
  // 'collection_id',
  'type_id',
  // 'origin_country',
  'created_at',
  'updated_at',
  'is_customizable',
  'gift_cover',
  'is_maker_ship',
  'store_id',
  'status',
  'type_lv2_id',
  'type_lv1_id',
  'like_cnt',
  'display_code',
  'display_id',
  'is_free_shipping',
]

const searchRelations = [
  'variants',
  'tags',
  'collection',
  'variants.prices',
  'variants.options',
  'options',
  'product_colors',
  'store',
]

interface InjectionDependencies {
  eventBusService: EventBusService
  productService: ProductService
  searchService: SearchService
  storeService: StoreService
  pricingService: PricingService
  logger: Logger
  cacheService: CacheService
}

const tempPriceContext: PriceSelectionContext = {
  currency_code: JAPANESE_CURRENCY_CODE,
}

const allowedStatus = [ProductStatus.PUBLISHED, ProductStatus.PROPOSED]

export default class SearchSubscriber {
  private eventBus_: EventBusService
  private productService_: ProductService
  private searchService_: SearchService
  private storeService_: StoreService
  private pricingService_: PricingService
  private logger_: Logger
  private cacheService_: CacheService

  constructor({
    eventBusService,
    searchService,
    productService,
    storeService,
    pricingService,
    logger,
    cacheService,
  }: InjectionDependencies) {
    this.eventBus_ = eventBusService

    this.pricingService_ = pricingService
    this.searchService_ = searchService
    this.storeService_ = storeService
    this.productService_ = productService
    this.cacheService_ = cacheService
    this.logger_ = logger

    this.eventBus_.subscribe(
      ProductService.Events.CREATED,
      this.handleProductCreation,
    )

    this.eventBus_.subscribe(
      ProductService.Events.UPDATED,
      this.handleProductUpdate,
    )

    this.eventBus_.subscribe(
      ProductService.Events.DELETED,
      this.handleProductDeletion,
    )

    this.eventBus_.subscribe(
      ProductVariantService.Events.CREATED,
      this.handleProductVariantChange,
    )

    this.eventBus_.subscribe(
      ProductVariantService.Events.UPDATED,
      this.handleProductVariantChange,
    )

    this.eventBus_.subscribe(
      ProductVariantService.Events.DELETED,
      this.handleProductVariantChange,
    )

    this.eventBus_.subscribe(
      ProductSearchService.TNG_SEARCH_INDEX_EVENT,
      this.indexDocuments,
    )

    this.eventBus_.subscribe(
      StoreService.Events.UPDATED,
      async (data: Store) => {
        await this.handleStoreUpdated({ id: data.id })
      },
    )
  }

  handleProductCreation = async (data: { id: string }) => {
    const product = await this.retrieveProduct_(data.id)
    if (!isProductValid(product)) return
    const convertedProduct = await this.convertProduct(product as Product)

    await this.searchService_.addDocuments(
      ProductService.CUSTOM_INDEX_NAME,
      [convertedProduct],
      indexTypes.products,
    )
  }

  retrieveProduct_ = async (product_id: string) => {
    // temporary hardcode currency_code to jpy
    const prod = await this.productService_.retrieve(product_id, {
      select: searchFields,
      relations: searchRelations,
    })

    if (prod.variants?.length) {
      prod.variants = prod.variants.filter((v: ProductVariant) => !v.is_deleted)
    }

    const pricedProds = await this.pricingService_.setProductPrices(
      [prod],
      tempPriceContext,
    )

    return pricedProds[0] as Product
  }

  convertProduct = async (product: Product) => {
    const newProduct = { ...product } as any
    newProduct.product_colors = (newProduct.product_colors || []).map(
      (pc) => pc.color_id,
    )

    const productStore = await this.storeService_.getStoreById(
      { id: newProduct.store_id },
      {
        select: [
          'id',
          'name',
          'free_ship_amount',
          'display_id',
          'plan_type',
          'is_return_guarantee',
        ],
      },
      false,
    )

    // can change in the future
    const minPrice = product.variants.reduce((acc: number, variant: any) => {
      return Math.min(acc, variant.calculated_price)
    }, Infinity)
    const inventory_quantity = product.variants.reduce(
      (acc: number, variant: any) => acc + variant.inventory_quantity || 0,
      0,
    )

    // delete newProduct.store_id
    delete newProduct.metadata

    newProduct.in_stock = product.variants.some(
      (variant) => !variant.manage_inventory || variant.inventory_quantity > 0,
    )
    newProduct.inventory_quantity = inventory_quantity
    newProduct.price = minPrice
    newProduct.has_gift_cover = product.gift_cover !== GiftCoverEnum.NONE
    newProduct.store = productStore || {}
    newProduct.is_return_guarantee =
      productStore?.is_return_guarantee ||
      productStore?.plan_type === StorePlanType.PRIME
    newProduct.tags = product.tags.map((tag) => tag.value)
    newProduct.created_at = Date.parse(newProduct?.created_at.toString()) / 1000

    // sale price
    const salePredicate = (p) => !!p?.price_list_id
    const prices = product.variants.find((v) =>
      v.prices?.some(salePredicate),
    )?.prices

    const price = prices?.find(salePredicate)
    if (price) {
      const priceList = price?.price_list
      if (priceList?.starts_at) {
        newProduct.sales_start_at = priceList?.starts_at
        newProduct.sales_start_at_timestamp = priceList?.starts_at
          ? Date.parse(priceList?.starts_at.toString()) / 1000
          : null
      }

      if (priceList?.ends_at) {
        newProduct.sales_end_at = priceList?.ends_at
        newProduct.sales_end_at_timestamp = priceList?.ends_at
          ? Date.parse(priceList?.ends_at.toString()) / 1000
          : null
      }

      newProduct.sales_price = price.amount
    }

    return newProduct
  }

  handleProductUpdate = async (data) => {
    await this.handleProductEvents(data)
    const product = await this.retrieveProduct_(data.id)
    if (!isProductValid(product)) {
      // if update product status from published status to other status => delete that from search index data
      await this.handleProductDeletion(data)
      return
    } else {
      // find if that product is already in search data or not, if not => add to melisearch
      const res = await this.searchService_.search(
        ProductService.CUSTOM_INDEX_NAME,
        '',
        { filter: [`id=${data.id}`] },
      )

      if (!res.hits.length) {
        await this.handleProductCreation(data)
        return
      }
    }

    const convertedProduct = await this.convertProduct(product as Product)

    await this.searchService_.addDocuments(
      ProductService.CUSTOM_INDEX_NAME,
      [convertedProduct],
      indexTypes.products,
    )
  }

  handleProductDeletion = async (data: any | any[]) => {
    if (!Array.isArray(data)) {
      await this.searchService_.deleteDocument(
        ProductService.CUSTOM_INDEX_NAME,
        data.id,
      )
    } else {
      await Promise.all(
        data.map(
          async (item) =>
            await this.searchService_.deleteDocument(
              ProductService.CUSTOM_INDEX_NAME,
              item.id,
            ),
        ),
      )
    }
  }

  handleProductVariantChange = async (data) => {
    await this.handleProductEvents({ id: data.product_id })
    const product = await this.retrieveProduct_(data.product_id)
    if (!isProductValid(product)) return
    const convertedProduct = await this.convertProduct(product as Product)

    await this.searchService_.addDocuments(
      ProductService.CUSTOM_INDEX_NAME,
      [convertedProduct],
      indexTypes.products,
    )
  }

  handleStoreUpdated = async (data: any = {}) => {
    const store = await this.storeService_.getStoreById(
      { id: data.id },
      { select: ['id', 'status'] },
      false,
    )

    if (!store) return

    // delete all documents before re-indexing
    const storeProducts = await this.productService_.list(
      // @ts-ignore
      { store_id: data.id },
      {
        select: ['id'],
      },
    )
    await Promise.all(
      storeProducts.map(
        async (item) =>
          await this.searchService_.deleteDocument(
            ProductService.CUSTOM_INDEX_NAME,
            item.id,
          ),
      ),
    )

    // if store status is approved, re-add to meilisearch
    if (store?.status === StoreStatus.APPROVED) {
      // get product that will be indexed again if store is approved
      const reindexedProducts = await this.productService_.list(
        // @ts-ignore
        { store_id: data.id, status: In(allowedStatus) },
        {
          select: searchFields,
          relations: searchRelations,
          order: { id: 'ASC' },
        },
      )

      reindexedProducts.map(async (e: Product) => {
        e = await this.standardizedVariants(e)
        return e
      })

      const pricedProducts = await this.pricingService_.setProductPrices(
        reindexedProducts,
        tempPriceContext,
      )
      const convertedProducts = await Promise.all(
        pricedProducts.map(
          async (product: any) => await this.convertProduct(product),
        ),
      )

      await this.searchService_.addDocuments(
        ProductService.CUSTOM_INDEX_NAME,
        convertedProducts,
        indexTypes.products,
      )
    }

    // clear cache of products of that store
    await this.cacheService_.clearCache(
      storeProducts.map((p) => `prod-detail-${p?.id}`),
    )
  }

  indexDocuments = async (config: any = {}): Promise<void> => {
    // get all inactive stores
    const inactiveStores = await this.storeService_.list(
      { status: Not(StoreStatus.APPROVED) },
      { select: ['id'] },
    )
    const exludeIds = inactiveStores.map((s) => s.id)

    const TAKE = (this.searchService_?.options?.batch_size as number) ?? 200
    let hasMore = true

    let lastSeenId = ''
    // only allow public and proposed products of active shop to be searched
    config.status = In(allowedStatus)
    config.store_id = Not(In(exludeIds))

    while (hasMore) {
      const products = await this.retrieveNextProducts(lastSeenId, TAKE, config)

      if (products.length > 0) {
        const convertedProducts = await Promise.all(
          products.map(
            async (product: any) => await this.convertProduct(product),
          ),
        )
        await this.searchService_.addDocuments(
          ProductService.CUSTOM_INDEX_NAME,
          convertedProducts,
          indexTypes.products,
        )

        // clear cache after index
        await this.cacheService_.clearCache(
          convertedProducts.map((p) => `prod-detail-${p?.id}`),
        )

        lastSeenId = products[products.length - 1].id
      } else {
        hasMore = false
      }
    }
  }

  protected async retrieveNextProducts(
    lastSeenId: string,
    take: number,
    config = {},
  ): Promise<any> {
    const products = await this.productService_.list(
      // @ts-ignore
      { id: { gt: lastSeenId }, ...config },
      {
        select: searchFields,
        relations: searchRelations,
        take: take,
        order: { id: 'ASC' },
      },
    )

    products.map(async (e: Product) => {
      e = await this.standardizedVariants(e)
      return e
    })

    return await this.pricingService_.setProductPrices(
      products,
      tempPriceContext,
    )
  }
  async standardizedVariants(product: Product) {
    if (product.variants?.length) {
      product.variants = product.variants.filter(
        (v: ProductVariant) => !v.is_deleted,
      )
    }
    return product
  }

  handleProductEvents = async ({ id }: { id: string }) => {
    try {
      // update is_soldout and prices field of product
      this.logger_.debug('Product updated with id ==> ' + id)

      // clear cache in redis
      await this.cacheService_.invalidate(`prod-detail-${id}`)

      await this.productService_.evaluateProduct(id)
    } catch (error) {
      this.logger_.error(error)
    }
  }
}

function isProductValid(product: Product) {
  return (
    allowedStatus.includes(product.status) &&
    product.store?.status === StoreStatus.APPROVED
  )
}
