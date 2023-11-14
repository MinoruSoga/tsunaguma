/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defaultAdminProductRelations } from '@medusajs/medusa'
import {
  Product as MedusaProduct,
  ProductStatus,
} from '@medusajs/medusa/dist/models'
import { ImageRepository } from '@medusajs/medusa/dist/repositories/image'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { PriceListRepository } from '@medusajs/medusa/dist/repositories/price-list'
import { FindWithoutRelationsOptions } from '@medusajs/medusa/dist/repositories/product'
import { ProductOptionRepository } from '@medusajs/medusa/dist/repositories/product-option'
import { ProductTagRepository } from '@medusajs/medusa/dist/repositories/product-tag'
import { ProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import {
  EventBusService,
  ProductCollectionService,
  ProductService as MedusaProductService,
} from '@medusajs/medusa/dist/services'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import {
  FilterableProductProps,
  FindProductConfig,
} from '@medusajs/medusa/dist/types/product'
import { buildQuery, isDefined } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import {
  EntityEventType,
  MedusaEventHandlerParams,
  OnMedusaEntityEvent,
  Service,
} from 'medusa-extender'
import { EntityManager, FindManyOptions, In, IsNull, Not } from 'typeorm'
import { v4 as uuid } from 'uuid'

import loadConfig from '../../../helpers/config'
import { SALE_PRODUCT_REQUIRE_DURATION } from '../../../helpers/constant'
import { converNumberToAz } from '../../../helpers/number'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { CacheService } from '../../../modules/cache/cache.service'
import { ProductFavoriteRepository } from '../../../modules/favorite/repository/product-favorite.repository'
import { SeqService } from '../../../modules/seq/seq.service'
import { StorePlanType } from '../../../modules/store/entity/store.entity'
import StoreService from '../../../modules/store/services/store.service'
import { DeliveryRequestAdminStatus } from '../../delivery-request/entities/delivery-request.entity'
import { DeliveryRequestRepository } from '../../delivery-request/repository/delivery-request.repository'
import { DeliveryRequestVariantRepository } from '../../delivery-request/repository/delivery-request-variant.repository'
import DeliveryRequestService from '../../delivery-request/services/delivery-request.service'
import { PrefectureService } from '../../prefecture/services/prefecture.service'
import { ShippingOptionStatusEnum } from '../../shipping/entities/shipping-option.entity'
import { ShippingOptionService } from '../../shipping/services/shipping-option.service'
import { ProductAddonService } from '../../store/services/product-addon.service'
import { User, UserType } from '../../user/entity/user.entity'
import UserService from '../../user/services/user.service'
import { CheckLikeStatusReq } from '../controllers/check-like-status.admin.controller'
import { ExtendedAdminPostProductReq } from '../controllers/create-product.admin.controller'
import {
  ProductDetailAddonRes,
  ProductDetailRes,
  ProductDetailShippingOptionRes,
  ProductDetailVariantRes,
} from '../controllers/get-product-detail.admin.controller'
import { ProductDetailCmsRes } from '../controllers/get-product-detail.cms.admin.controller'
import { GetProductNameCms } from '../controllers/get-product-name.cms.admin.controller'
import { ExtendedAdminPostProductsProductReq } from '../controllers/update-product.admin.controller'
import { Image } from '../entity/image.entity'
import { Product, ProductStatusEnum } from '../entity/product.entity'
import { ProductType } from '../entity/product-type.entity'
import { ProductVariant } from '../entity/product-variant.entity'
import ProductRepository from '../repository/product.repository'
import { ProductAddonsRepository } from '../repository/product-addons.repository'
import { ProductColorsRepository } from '../repository/product-colors.repository'
import { ProductImagesRepository } from '../repository/product-images.repository'
import { ProductMaterialRepository } from '../repository/product-material.repository'
import { ProductShippingOptionsRepository } from '../repository/product-shipping-options.repository'
import { ProductSpecsRepository } from '../repository/product-specs.repository'
import ProductTypeRepository from '../repository/product-type.repository'
import { FulfillmentProvider } from './../../shipping/entities/fulfillment-provider.entity'
import { ProductAddonsService } from './product-addons.service'
import { ProductHistoryService } from './product-history.service'
import { ProductSaleService } from './product-sale.service'
import { ProductSortService } from './product-sort.service'
import { ProductTypeService } from './product-type.service'
import { ProductVariantService } from './product-variant.service'

type ConstructorParams = {
  manager: EntityManager
  loggedInUser?: User
  productRepository: typeof ProductRepository
  productVariantRepository: typeof ProductVariantRepository
  productOptionRepository: typeof ProductOptionRepository
  eventBusService: EventBusService
  productVariantService: ProductVariantService
  productCollectionService: ProductCollectionService
  productTypeRepository: typeof ProductTypeRepository
  productTagRepository: typeof ProductTagRepository
  productTypeService: ProductTypeService
  imageRepository: typeof ImageRepository
  productImagesRepository: typeof ProductImagesRepository
  productColorsRepository: typeof ProductColorsRepository
  productAddonsRepository: typeof ProductAddonsRepository
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  productSpecsRepository: typeof ProductSpecsRepository
  productMaterialRepository: typeof ProductMaterialRepository
  productFavoriteRepository: typeof ProductFavoriteRepository
  productHistoryService: ProductHistoryService
  searchService: any
  userService: UserService
  cartRepository: any
  priceSelectionStrategy: any
  featureFlagRouter: any
  productAddonsService: ProductAddonsService
  seqService: SeqService
  storeService: StoreService
  logger: Logger
  productAddonService: ProductAddonService
  cacheService: CacheService
  shippingOptionService: ShippingOptionService
  prefectureService: PrefectureService
  productSortService: ProductSortService
  priceListRepository: typeof PriceListRepository
  moneyAmountRepository: typeof MoneyAmountRepository
  deliveryRequestRepository: typeof DeliveryRequestRepository
  deliveryRequestVariantRepository: typeof DeliveryRequestVariantRepository
}

const sortStatus = [ProductStatus.PUBLISHED, ProductStatus.PROPOSED]

@Service({ scope: 'SCOPED', override: MedusaProductService })
export class ProductService extends MedusaProductService {
  static CUSTOM_INDEX_NAME = 'tng_products'
  readonly manager: EntityManager
  protected productRepository_: typeof ProductRepository
  protected productAddonsService_: ProductAddonsService
  protected productImagesRepository_: typeof ProductImagesRepository
  protected productColorsRepository_: typeof ProductColorsRepository
  protected productAddonsRepository_: typeof ProductAddonsRepository
  protected productShippingOptionsRepository_: typeof ProductShippingOptionsRepository
  protected productSpecsRepository_: typeof ProductSpecsRepository
  protected productMaterialRepository_: typeof ProductMaterialRepository
  protected productVariantRepository_: typeof ProductVariantRepository
  protected productFavoriteRepository_: typeof ProductFavoriteRepository
  protected productVariantService_: ProductVariantService
  protected productHistoryService_: ProductHistoryService
  protected seqService_: SeqService
  protected storeService_: StoreService
  protected shippingOptionServive_: ShippingOptionService
  protected productAddonServive_: ProductAddonService
  protected prefectureService_: PrefectureService
  protected productSortService_: ProductSortService
  protected priceListRepository_: typeof PriceListRepository
  protected userService_: UserService
  protected moneyAmountRepository_: typeof MoneyAmountRepository
  protected readonly deliveryRequestRepo_: typeof DeliveryRequestRepository
  protected deliveryRequestVariantRepo_: typeof DeliveryRequestVariantRepository
  private logger_: Logger

  static Events = {
    ...MedusaProductService.Events,
    STATUS_CHANGE: 'product.status_changed',
  }

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.container = container
    this.manager = container.manager
    this.productRepository_ = container.productRepository
    this.productAddonsService_ = container.productAddonsService
    this.productImagesRepository_ = container.productImagesRepository
    this.productColorsRepository_ = container.productColorsRepository
    this.productAddonsRepository_ = container.productAddonsRepository
    this.productShippingOptionsRepository_ =
      container.productShippingOptionsRepository
    this.productSpecsRepository_ = container.productSpecsRepository
    this.productMaterialRepository_ = container.productMaterialRepository
    this.productVariantRepository_ = container.productVariantRepository
    this.productVariantService_ = container.productVariantService
    this.productHistoryService_ = container.productHistoryService
    this.productFavoriteRepository_ = container.productFavoriteRepository
    this.seqService_ = container.seqService
    this.storeService_ = container.storeService
    this.shippingOptionServive_ = container.shippingOptionService
    this.productAddonServive_ = container.productAddonService
    this.prefectureService_ = container.prefectureService
    this.productSortService_ = container.productSortService
    this.logger_ = container.logger
    this.userService_ = container.userService
    this.priceListRepository_ = container.priceListRepository
    this.moneyAmountRepository_ = container.moneyAmountRepository
    this.deliveryRequestRepo_ = container.deliveryRequestRepository
    this.deliveryRequestVariantRepo_ =
      container.deliveryRequestVariantRepository
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ProductService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager
    return cloned
  }

  async listByStatus(
    storeId: string,
    selector: Selector<Product>,
    config: FindConfig<Product>,
  ): Promise<[Product[], number]> {
    return this.atomicPhase_(async (tx) => {
      try {
        const proRepo = tx.getCustomRepository(this.productRepository_)

        const sort = selector['sort']

        if (sort) {
          delete selector['sort']
        }

        const stock = selector['stock']
        if (stock) {
          delete selector['stock']
        }

        let data = []

        const title = selector.title as string
        if (selector.title) {
          delete selector.title
        }
        const status = selector.status as string
        if (stock === 'in-stock') {
          data = await this.withTransaction(tx).getListIdProductStock(
            'in-stock',
            config,
            title,
            sort,
            storeId,
            status,
          )
        } else if (stock === 'out-stock') {
          data = await this.withTransaction(tx).getListIdProductStock(
            'out-stock',
            config,
            title,
            sort,
            storeId,
            status,
          )
        } else {
          data = await this.withTransaction(tx).getListIdProductStock(
            'all',
            config,
            title,
            sort,
            storeId,
            status,
          )
        }
        const [arr, count] = data

        const dataId = arr ? arr.map((e: any) => e.product_id) : ''

        if (
          Object.keys(config.order)[0] === 'like_cnt' &&
          config.order[Object.keys(config.order)[0]] === 'DESC'
        ) {
          config.order = { like_cnt: 'DESC', created_at: 'DESC' }
        } else if (
          Object.keys(config.order)[0] === 'like_cnt' &&
          config.order[Object.keys(config.order)[0]] === 'ASC'
        ) {
          config.order = { like_cnt: 'ASC', created_at: 'DESC' }
        }

        delete config.skip

        const query = buildQuery({ ...selector, id: In(dataId) }, config)

        query.relations = [
          'variants',
          'store',
          'product_addons',
          'type',
          'type_lv1',
          'type_lv2',
        ]

        const raw = await proRepo.find(query)

        const products = Object.values(
          _.merge(_.keyBy(raw, 'id'), _.keyBy(arr, 'product_id')),
        )

        if (sort === 'lowstock') {
          products.sort((a, b) => a.stock_quantity - b.stock_quantity)
        }

        if (sort === 'stock') {
          products.sort((a, b) => b.stock_quantity - a.stock_quantity)
        }
        return [products, count || 0]
      } catch (error) {
        this.logger_.error(error)
        return [[], 0]
      }
    })
  }

  async listProductTypeHistory(
    storeId: string,
    selector: Selector<Product>,
    config: FindConfig<Product>,
  ): Promise<[Product[]]> {
    return this.atomicPhase_(async (tx) => {
      try {
        const proRepo = tx.getCustomRepository(this.productRepository_)

        const limit = config.take || 10
        const offset = config.skip || 0

        const qb = proRepo
          .createQueryBuilder('product')
          .innerJoin('product.store', 'product_store')
          .select(['product.id', 'product.type_id'])
          .leftJoinAndSelect('product.type', 'product_type')
          .leftJoinAndSelect('product.type_lv1', 'product_type2')
          .leftJoinAndSelect('product.type_lv2', 'product_type3')
          .where('1 = 1')
          .groupBy(
            'product.type_id,product.id,product_type.id,product_type2.id,product_type3.id',
          )
          .orderBy('product.created_at', 'DESC')

        qb.andWhere('product.status = :status', {
          status: ProductStatus.PUBLISHED,
        })
        qb.andWhere(
          '(product.store_id = :storeId OR product_store.url = :storeId)',
          { storeId: storeId },
        )

        if (limit) {
          qb.limit(limit)
        }

        if (offset) {
          qb.offset(offset)
        }

        const result = await qb.getMany()
        return [result as any]
      } catch (error) {
        this.logger_.error(error)
        return [[]]
      }
    })
  }

  async listByStore(
    selector: Selector<Product> & { excludes?: string },
    config: FindConfig<Product>,
  ): Promise<[Product[], number]> {
    return this.atomicPhase_(async (tx) => {
      const proRepo = tx.getCustomRepository(this.productRepository_)

      const status = (selector.status || ProductStatus.PUBLISHED) as string
      delete selector.status

      const sort = selector['sort']
      if (sort) {
        delete selector['sort']
      }

      const excludes = selector.excludes
      delete selector.excludes

      const storeId = selector.store_id as string
      delete selector.store_id
      let query: FindManyOptions<Product> = buildQuery(selector, config)

      query.where = [{ store_id: storeId }, { store: { url: storeId } }]

      function filterExcludeProductIds(pIds: string[], e?: string) {
        if (!e) return pIds
        const ids = e.split(',')
        return pIds.filter((id) => !ids.includes(id))
      }

      let data = []
      if (status) {
        if (status === 'published') {
          data = await this.withTransaction(tx).getListIdProductStock(
            'in-stock',
            config,
            '',
            sort,
            storeId,
            status,
            excludes,
          )
        }
        if (status === 'rejected') {
          data = await this.withTransaction(tx).getListIdProductStock(
            'out-stock',
            config,
            '',
            sort,
            storeId,
            'published',
            excludes,
          )
        }

        if (status === 'proposed') {
          data = await this.withTransaction(tx).getListIdProductStock(
            'all',
            config,
            '',
            sort,
            storeId,
            status,
            excludes,
          )
        }
      } else {
        data = await this.withTransaction(tx).getListIdProductStock(
          'all',
          config,
          '',
          sort,
          storeId,
          excludes,
        )
      }
      const [arr, count] = data

      delete config.skip

      const dataId = arr ? arr.map((e: any) => e.product_id) : ''

      query = buildQuery(
        { ...selector, id: In(filterExcludeProductIds(dataId, excludes)) },
        config,
      )

      if (
        Object.keys(config.order)[0] === 'like_cnt' &&
        config.order[Object.keys(config.order)[0]] === 'DESC'
      ) {
        query.order = { like_cnt: 'DESC', created_at: 'DESC' }
      } else if (
        Object.keys(config.order)[0] === 'like_cnt' &&
        config.order[Object.keys(config.order)[0]] === 'ASC'
      ) {
        query.order = { like_cnt: 'ASC', created_at: 'DESC' }
      } else if (Object.keys(config.order)[0] === 'rank') {
        query.order = { shop_rank: 'ASC', created_at: 'DESC' }
      }

      query.relations = ['variants', 'store']

      const raw = await proRepo.find(query)

      const products = Object.values(
        _.merge(_.keyBy(raw, 'id'), _.keyBy(arr, 'product_id')),
      )

      if (sort === 'lowstock') {
        products.sort((a, b) => a.stock_quantity - b.stock_quantity)
      }

      if (sort === 'stock') {
        products.sort((a, b) => b.stock_quantity - a.stock_quantity)
      }
      return [products, count || 0]
    })
  }

  async getListIdProductStock(
    stock?: string,
    config?: FindConfig<Product>,
    title?: string,
    sort?: string,
    storeId?: string,
    status?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    exludes?: string,
  ): Promise<[string[], number]> {
    const proRepo = this.manager_.getCustomRepository(this.productRepository_)
    const sysConfig = loadConfig()

    const limit = config.take
    const offset = config.skip

    const key = Object.keys(config.order)
    const [param] = key

    const qb = proRepo
      .createQueryBuilder('product')
      .select([
        'product.id',
        'sum(product_variant.inventory_quantity) as stock_quantity',
      ])
      .leftJoin('product.variants', 'product_variant')
      .innerJoin('product.store', 'product_store')
      .where('1 = 1 AND product_variant.is_deleted = false')

    const countQb = proRepo
      .createQueryBuilder('product')
      .select([
        'product.id',
        'sum(product_variant.inventory_quantity) as stock_quantity',
      ])
      .leftJoin('product.variants', 'product_variant')
      .innerJoin('product.store', 'product_store')
      .where('1 = 1')

    if (sysConfig.app.deletedStatusFlag) {
      qb.andWhere('product.status <> :delFlag', { delFlag: 'deleted' })
      countQb.andWhere('product.status <> :delFlag', { delFlag: 'deleted' })
    }

    if (exludes) {
      qb.andWhere(`product.id NOT IN ('${exludes}')`)
    }

    if (status) {
      qb.andWhere('product.status = :status', { status: status })
      countQb.andWhere('product.status = :status', { status: status })
    }

    if (storeId) {
      qb.andWhere(
        '(product.store_id = :storeId OR product_store.url = :storeId)',
        { storeId: storeId },
      )
      countQb.andWhere(
        '(product.store_id = :storeId OR product_store.url = :storeId)',
        { storeId: storeId },
      )
    }

    if (title) {
      qb.andWhere('upper(product.title) LIKE :title ', {
        title: `%${title.toUpperCase()}%`,
      })
      countQb.andWhere('upper(product.title) LIKE :title ', {
        title: `%${title.toUpperCase()}%`,
      })
    }

    if (param) {
      if (param === 'like_cnt') {
        qb.orderBy(`product.${param}`, `${config.order[param]}`)
        qb.addOrderBy(`product.created_at`, 'DESC')
      } else if (param === 'rank') {
        qb.orderBy(`product.shop_rank`, 'ASC')
        qb.addOrderBy(`product.created_at`, 'DESC')
      } else {
        qb.orderBy(`product.${param}`, `${config.order[param]}`)
      }
    }

    qb.groupBy('product.id')
    countQb.groupBy('product.id')

    if (stock === 'in-stock') {
      qb.having(
        'sum(product_variant.inventory_quantity) > 0 OR sum(CAST(product_variant.manage_inventory as INT)) < count(product.id)',
      )
      countQb.having(
        'sum(product_variant.inventory_quantity) > 0 OR sum(CAST(product_variant.manage_inventory as INT)) < count(product.id)',
      )
    }

    if (stock === 'out-stock') {
      qb.having(
        'sum(product_variant.inventory_quantity) = 0 AND sum(CAST(product_variant.manage_inventory as INT)) = count(product.id) ',
      )
      countQb.having(
        'sum(product_variant.inventory_quantity) = 0 AND sum(CAST(product_variant.manage_inventory as INT)) = count(product.id) ',
      )
    }

    if (sort === 'stock') {
      qb.orderBy('sum(product_variant.inventory_quantity)', 'DESC')
    }
    if (sort === 'lowstock') {
      qb.orderBy('sum(product_variant.inventory_quantity)', 'ASC')
    }

    if (limit) {
      qb.limit(limit)
    }

    if (offset) {
      qb.offset(offset)
    }

    const total = (await countQb.getRawMany()).length

    const result = await qb.getRawMany()

    return [result, total]
  }

  async updateStatus(ids: string[], status: string) {
    return this.atomicPhase_(async (transactionManager) => {
      const proRepo = transactionManager.getCustomRepository(
        this.productRepository_,
      )
      const config = loadConfig()

      // validate products
      const products = await proRepo.find({
        where: { id: In(ids) },
        select: ['id', 'status', 'shop_rank', 'store_id'],
        order: { shop_rank: 'ASC' },
      })

      const updatedProducts = products.filter((p) => p.status !== status)
      const updatedProductsIds = updatedProducts.map((p) => p.id)

      if (!updatedProductsIds.length) return

      const statusSet = new Set(updatedProducts.map((p) => p.status))
      const storeSet = new Set(updatedProducts.map((p) => p.store_id))
      if (statusSet.size !== 1 || storeSet.size !== 1)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Products are not of same type or store id !',
        )

      const currentStatus = Array.from(statusSet).at(0)
      const currentStore = Array.from(storeSet).at(0)

      if (status === 'delete') {
        const toUpdate = config.app.deletedStatusFlag
          ? { status: ProductStatusEnum.deleted as any }
          : { deleted_at: new Date() }
        const res = await proRepo
          .createQueryBuilder()
          .update(Product)
          .set({
            ...toUpdate,
            deleted_by: this.container.loggedInUser?.id,
          })
          .where({ id: In(updatedProductsIds) })
          .execute()

        // update rank of all deleted products
        if (sortStatus.includes(currentStatus)) {
          const isInitRank = await this.productSortService_
            .withTransaction(transactionManager)
            .checkInitRank(currentStore)
          if (!isInitRank) {
            await this.productSortService_
              .withTransaction(transactionManager)
              .initRank(currentStore)
          } else {
            await this.productSortService_
              .withTransaction(transactionManager)
              .reIndexRankByStatus(currentStore, currentStatus)
          }
        }

        for (const id of updatedProductsIds) {
          await this.eventBus_
            .withTransaction(transactionManager)
            .emit(ProductService.Events.DELETED, { id })
          await this.container.cacheService.invalidate(`prod-detail-${id}`)
        }

        return res
      }

      let prodStatus: ProductStatus
      switch (status) {
        case 'sale':
          prodStatus = ProductStatus.PUBLISHED
          break
        case 'exhibit':
          prodStatus = ProductStatus.PROPOSED
          break
        case 'private':
          prodStatus = ProductStatus.REJECTED
          break
        default:
          return undefined
      }

      if (currentStatus === prodStatus) return

      const res = await proRepo
        .createQueryBuilder()
        .update(Product)
        .set({
          status: prodStatus,
          updated_by: this.container.loggedInUser?.id,
        })
        .where({ id: In(updatedProductsIds) })
        .execute()

      // update rank of all deleted products
      if (
        sortStatus.includes(prodStatus) ||
        sortStatus.includes(currentStatus)
      ) {
        const isInitRank = await this.productSortService_
          .withTransaction(transactionManager)
          .checkInitRank(currentStore)
        if (!isInitRank) {
          await this.productSortService_
            .withTransaction(transactionManager)
            .initRank(currentStore)
        } else {
          // already init rank
          if (sortStatus.includes(currentStatus)) {
            await this.productSortService_
              .withTransaction(transactionManager)
              .reIndexRankByStatus(currentStore, currentStatus)
          }

          if (sortStatus.includes(prodStatus)) {
            await this.productSortService_
              .withTransaction(transactionManager)
              .addBulkRanksByStatus(
                currentStore,
                prodStatus,
                updatedProductsIds,
              )
          }
        }
      }

      for (const id of updatedProductsIds) {
        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(ProductService.Events.UPDATED, {
            id,
          })
        await this.container.cacheService.invalidate(`prod-detail-${id}`)
      }

      return res
    })
  }

  async updateStatusCms(
    ids: string[],
    status: string,
    loggedInUser: LoggedInUser,
  ) {
    return this.atomicPhase_(async (transactionManager) => {
      const proRepo = transactionManager.getCustomRepository(
        this.productRepository_,
      )
      const config = loadConfig()

      // validate products
      const products = await proRepo.find({
        where: { id: In(ids) },
        select: ['id', 'status', 'shop_rank', 'store_id'],
        order: { shop_rank: 'ASC' },
      })

      const updatedProducts = products.filter((p) => p.status !== status)
      const updatedProductsIds = updatedProducts.map((p) => p.id)

      if (!updatedProductsIds.length) return

      const statusSet = new Set(updatedProducts.map((p) => p.status))
      const storeSet = new Set(updatedProducts.map((p) => p.store_id))
      if (statusSet.size !== 1 || storeSet.size !== 1)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Products are not of same type or store id !',
        )

      const currentStatus = Array.from(statusSet).at(0)
      const currentStore = Array.from(storeSet).at(0)

      if (status === 'delete') {
        const toUpdate = config.app.deletedStatusFlag
          ? { status: ProductStatusEnum.deleted as any }
          : { deleted_at: new Date() }
        const res = await proRepo
          .createQueryBuilder()
          .update(Product)
          .set({
            ...toUpdate,
            deleted_by: loggedInUser?.id,
          })
          .where({ id: In(updatedProductsIds) })
          .execute()

        // update rank of all deleted products
        if (sortStatus.includes(currentStatus)) {
          const isInitRank = await this.productSortService_
            .withTransaction(transactionManager)
            .checkInitRank(currentStore)
          if (!isInitRank) {
            await this.productSortService_
              .withTransaction(transactionManager)
              .initRank(currentStore)
          } else {
            await this.productSortService_
              .withTransaction(transactionManager)
              .reIndexRankByStatus(currentStore, currentStatus)
          }
        }

        for (const id of updatedProductsIds) {
          await this.eventBus_
            .withTransaction(transactionManager)
            .emit(ProductService.Events.DELETED, { id })
          await this.container.cacheService.invalidate(`prod-detail-${id}`)
        }

        return res
      }

      let prodStatus: ProductStatus
      switch (status) {
        case 'sale':
          prodStatus = ProductStatus.PUBLISHED
          break
        case 'exhibit':
          prodStatus = ProductStatus.PROPOSED
          break
        case 'private':
          prodStatus = ProductStatus.REJECTED
          break
        default:
          return undefined
      }

      if (currentStatus === prodStatus) return

      const res = await proRepo
        .createQueryBuilder()
        .update(Product)
        .set({
          status: prodStatus,
          updated_by: loggedInUser?.id,
        })
        .where({ id: In(updatedProductsIds) })
        .execute()

      // update rank of all deleted products
      if (
        sortStatus.includes(prodStatus) ||
        sortStatus.includes(currentStatus)
      ) {
        const isInitRank = await this.productSortService_
          .withTransaction(transactionManager)
          .checkInitRank(currentStore)
        if (!isInitRank) {
          await this.productSortService_
            .withTransaction(transactionManager)
            .initRank(currentStore)
        } else {
          // already init rank
          if (sortStatus.includes(currentStatus)) {
            await this.productSortService_
              .withTransaction(transactionManager)
              .reIndexRankByStatus(currentStore, currentStatus)
          }

          if (sortStatus.includes(prodStatus)) {
            await this.productSortService_
              .withTransaction(transactionManager)
              .addBulkRanksByStatus(
                currentStore,
                prodStatus,
                updatedProductsIds,
              )
          }
        }
      }

      for (const id of updatedProductsIds) {
        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(ProductService.Events.UPDATED, {
            id,
          })
        await this.container.cacheService.invalidate(`prod-detail-${id}`)
      }

      return res
    })
  }

  private async genProdCode(
    storeId: string,
    categoryId: string,
  ): Promise<string> {
    const store = await this.storeService_.retrieve_(storeId)
    const productType = (await this.container.productTypeService.retrieve(
      categoryId,
    )) as ProductType
    const prodSeq = await this.seqService_.getProductSeqByCategoryId(categoryId)
    // CAB -> converNumberToAz(0, 2056)
    // CAC -> converNumberToAz(1, 2056)
    // CAB0001 -> 1
    // CAB0002 -> 2
    // CAB9999 -> 9999
    // CAC0000 -> 10000
    // CAC0001 -> 10001
    // CAC9999 -> 19999
    return `${converNumberToAz(Math.floor(store.display_id / 10000), 2056)}${(
      (store.display_id % 10000) +
      ''
    ).padStart(4, '0')}-${
      store.plan_type === StorePlanType.PRIME ? 2 : 1
    }-${converNumberToAz(productType.display_id)}-${(prodSeq + '').padStart(
      4,
      '0',
    )}`
  }

  async create(
    productObject: ExtendedAdminPostProductReq & { profile_id: string },
    userId?: string,
  ): Promise<Product> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getCustomRepository(
        this.productRepository_,
      ) as ProductRepository
      const productTagRepo = manager.getCustomRepository(
        this.productTagRepository_,
      ) as ProductTagRepository
      const imageRepo: ImageRepository = manager.getCustomRepository(
        this.imageRepository_,
      )
      const productImagesRepo = manager.getCustomRepository(
        this.productImagesRepository_,
      )
      const productColorsRepo = manager.getCustomRepository(
        this.productColorsRepository_,
      )
      const productAddonsRepo = manager.getCustomRepository(
        this.productAddonsRepository_,
      )
      const productShippingOptionsRepo = manager.getCustomRepository(
        this.productShippingOptionsRepository_,
      )
      const productSpecsRepo = manager.getCustomRepository(
        this.productSpecsRepository_,
      )
      const productMaterialRepo = manager.getCustomRepository(
        this.productMaterialRepository_,
      )

      const {
        tags,
        images,
        product_colors: productColors,
        product_addons: productAddons,
        shipping_options: shippingOptions,
        product_giftcovers: giftcovers,
        product_specs: productSpecs,
        product_sizes: productSizes,
        sizes_note: productSizesNote,
        ...rest
      } = productObject

      if (!rest.thumbnail && images?.length) {
        const imageUrl = images[0] as any

        typeof imageUrl === 'object'
          ? (rest.thumbnail = imageUrl.url)
          : (rest.thumbnail = imageUrl)
      }

      if (typeof rest.thumbnail == 'object') {
        const thumbnailObj = rest.thumbnail as any
        rest.thumbnail = thumbnailObj.url
      }

      let product = productRepo.create(rest)

      if (tags?.length) {
        product.tags = await productTagRepo.upsertTags(tags)
      }

      if (product.type_id) {
        const prodTypes = await this.container.productTypeService.retrieveAll(
          product.type_id,
        )
        if (!prodTypes) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'the product type not found!',
          )
        }
        // add parent type
        if (prodTypes.parent) {
          product.type_lv2_id = prodTypes.parent_id
          product.type_lv1_id = prodTypes.parent.parent_id
        }
      }

      product.metadata = {
        ...(product.metadata || {}),
        gift_covers: giftcovers,
        sizes: productSizes,
        sizes_note: productSizesNote,
      }

      if (product.material_id) {
        const material = await productMaterialRepo.findOne(product.material_id)
        if (!material) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'the material not found!',
          )
        }
        product.material = material.name
      }

      if (product.store_id) {
        const store = await this.storeService_.retrieve_(product.store_id)
        product.store_id = store.id
      }

      let loggedInUser
      if (!userId) {
        loggedInUser = this.container.loggedInUser
      } else {
        loggedInUser = await this.userService_
          .withTransaction(manager)
          .retrieve(userId, { select: ['id', 'store_id', 'type', 'status'] })
      }

      if (
        !loggedInUser ||
        // loggedInUser.type === UserType.STORE_PRIME ||
        loggedInUser.type === UserType.CUSTOMER ||
        (!!product.store_id &&
          product.store_id !== loggedInUser.store_id &&
          loggedInUser.type === UserType.STORE_STANDARD)
      ) {
        this.logger_.error(
          `store not correct: ${product.store_id} with ( ${loggedInUser?.id} / ${loggedInUser?.type} / ${loggedInUser?.store_id})`,
        )
      }

      if (!product.store_id) {
        product.store_id = loggedInUser.store_id
      }

      if (product.type_id) {
        product.display_code = await this.genProdCode(
          product.store_id,
          product.type_id,
        )
      }
      if (
        product.store_id !== loggedInUser?.store_id &&
        (loggedInUser?.type === UserType.ADMIN_ADMIN ||
          loggedInUser?.type === UserType.ADMIN_STAFF)
      ) {
        product.is_prime = true
      }
      product.created_by = loggedInUser?.id

      if (rest.status === ProductStatus.PUBLISHED) {
        product.released_at = new Date()
      }

      product = await productRepo.save(product)

      if (images?.length) {
        let imageMatadata = {}
        const imageEntities = (await imageRepo.upsertImages(
          images.map((i: any) => {
            if (typeof i === 'object') {
              return i.url
            } else {
              return i
            }
          }),
        )) as Image[]

        imageMatadata = images.map((i: any) => i.metadata)
        ;(async () => {
          await Promise.all(
            imageEntities.map((img, idx) => {
              if (imageMatadata[idx])
                imageRepo.update(img.id, { metadata: imageMatadata[idx] })
            }),
          )
        })()

        product.product_images = await Promise.all(
          imageEntities.map((img, idx) =>
            productImagesRepo.save(
              productImagesRepo.create({
                product_id: product.id,
                image_id: img.id,
                rank: idx + 1,
              }),
            ),
          ),
        )
      }

      if (productColors?.length) {
        product.product_colors = await Promise.all(
          productColors.map((color, idx) =>
            productColorsRepo.save(
              productColorsRepo.create({
                product_id: product.id,
                color_id: color,
                rank: idx + 1,
              }),
            ),
          ),
        )
      }

      if (productAddons?.length) {
        // validate product addons belongs to that store or not
        await this.productAddonServive_
          .withTransaction(this.transactionManager_)
          .validateByStore(productAddons, product.store_id)

        product.product_addons = await Promise.all(
          productAddons.map((addon, idx) =>
            productAddonsRepo.save(
              productAddonsRepo.create({
                product_id: product.id,
                lv1_id: addon,
                rank: idx + 1,
              }),
            ),
          ),
        )
      }

      if (shippingOptions?.length) {
        // validate shipping options belongs to that store or not
        await this.shippingOptionServive_
          .withTransaction(this.transactionManager_)
          .validateByStore(
            shippingOptions.map((s) => s.id),
            product.store_id,
          )

        product.product_shipping_options = await Promise.all(
          shippingOptions.map((opt, idx) =>
            productShippingOptionsRepo.save(
              productShippingOptionsRepo.create({
                product_id: product.id,
                shipping_option_id: opt.id,
                bulk_added_price: opt.bulk_added_price,
                rank: idx + 1,
              }),
            ),
          ),
        )
      }

      if (productSpecs?.length) {
        product.product_specs = await Promise.all(
          productSpecs.map((spec, idx) =>
            productSpecsRepo.save(
              productSpecsRepo.create({
                ...spec,
                product_id: product.id,
                rank: idx + 1,
              }),
            ),
          ),
        )
      }

      const result = (await this.retrieve(product.id)) as Product

      delete result.margin_rate
      delete result.spec_rate
      delete result.spec_starts_at
      delete result.spec_ends_at

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.CREATED, {
          id: result.id,
        })

      return result
    })
  }

  async update(
    productId: string,
    productObject: ExtendedAdminPostProductsProductReq,
    userId?: string,
  ): Promise<Product> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getCustomRepository(
        this.productRepository_,
      ) as ProductRepository
      const productTagRepo = manager.getCustomRepository(
        this.productTagRepository_,
      ) as ProductTagRepository
      const imageRepo: ImageRepository = manager.getCustomRepository(
        this.imageRepository_,
      )
      const productImagesRepo = manager.getCustomRepository(
        this.productImagesRepository_,
      )
      const productColorsRepo = manager.getCustomRepository(
        this.productColorsRepository_,
      )
      const productAddonsRepo = manager.getCustomRepository(
        this.productAddonsRepository_,
      )
      const productShippingOptionsRepo = manager.getCustomRepository(
        this.productShippingOptionsRepository_,
      )
      const productSpecsRepo = manager.getCustomRepository(
        this.productSpecsRepository_,
      )
      const productMaterialRepo = manager.getCustomRepository(
        this.productMaterialRepository_,
      )
      const productVariantRepo = manager.getCustomRepository(
        this.productVariantRepository_,
      )
      const priceListRepo = manager.getCustomRepository(
        this.priceListRepository_,
      )
      const moneyAmountRepo = manager.getCustomRepository(
        this.moneyAmountRepository_,
      )

      await this.productHistoryService_
        .withTransaction(manager)
        .create(productId, userId)

      const relations = ['variants', 'tags', 'images']
      const product = (await this.retrieve(productId, {
        relations,
      })) as Product

      if (!product) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          'the product type not found!',
        )
      }

      const {
        tags,
        images,
        variants,
        product_colors: productColors,
        product_addons: productAddons,
        shipping_options: shippingOptions,
        product_giftcovers: giftcovers,
        product_specs: productSpecs,
        product_sizes: productSizes,
        sizes_note: productSizesNote,
        metadata,
        display_code,
        ...rest
      } = productObject
      const oldStatus = product.status

      // update thumbnail
      if (!rest.thumbnail && images?.length) {
        const imageUrl = images[0] as any
        typeof imageUrl === 'object'
          ? (rest.thumbnail = imageUrl.url)
          : (rest.thumbnail = imageUrl)
      }
      // update tags
      if (tags) {
        if (tags.length) {
          product.tags = await productTagRepo.upsertTags(tags)
        } else {
          product.tags = []
        }
      }
      // update type
      if (rest.type_id && rest.type_id !== product.type_id) {
        const prodTypes = await this.container.productTypeService.retrieveAll(
          rest.type_id,
        )
        if (!prodTypes) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'the product type not found!',
          )
        }
        product.type_id = rest.type_id || null
        product.type_lv2_id = prodTypes.parent_id || null
        product.type_lv1_id = prodTypes.parent.parent_id || null
      }

      // init product metadata
      if (metadata) {
        product.metadata = { ...(product.metadata || {}), ...metadata }
      }

      // update gift_covers
      if (giftcovers) {
        product.metadata.gift_covers = giftcovers
      }
      // update sizes
      if (productSizes) {
        product.metadata.sizes = productSizes
      }

      if (isDefined(productSizesNote)) {
        product.metadata.sizes_note = productSizesNote
      }

      // update material
      if (rest.material_id && rest.material_id !== product.material_id) {
        const material = await productMaterialRepo.findOne(product.material_id)
        if (!material) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'the material not found!',
          )
        }
        product.material = material.name
      } else if (rest.material_id === '' || rest.material_id === null) {
        rest.material_id = null
        product.material = null
      }

      if (images) {
        await productImagesRepo.delete({ product_id: productId })
        if (images.length) {
          let imageMatadata = {}
          const imageEntities = (await imageRepo.upsertImages(
            images.map((i: any) => {
              if (typeof i === 'object') {
                return i.url
              } else {
                return i
              }
            }),
          )) as Image[]
          imageMatadata = images.map((i: any) => i.metadata)
          ;(async () => {
            await Promise.all(
              imageEntities.map((img, idx) => {
                if (imageMatadata[idx])
                  imageRepo.update(img.id, { metadata: imageMatadata[idx] })
              }),
            )
          })()

          product.product_images = await Promise.all(
            imageEntities.map((img, idx) =>
              productImagesRepo.save(
                productImagesRepo.create({
                  product_id: product.id,
                  image_id: img.id,
                  rank: idx + 1,
                }),
              ),
            ),
          )
          await productImagesRepo.delete({
            product_id: product.id,
            image_id: Not(In(imageEntities.map(({ id }) => id))),
          })
        } else {
          product.product_images = []
        }
        const data = await productImagesRepo.find({
          product_id: productId,
        })
        product.images = []
        data.map(async (img) =>
          product.images.push(...(await imageRepo.find({ id: img.image_id }))),
        )
      }

      if (productColors) {
        await productColorsRepo.delete({
          product_id: product.id,
        })
        product.product_colors = await Promise.all(
          productColors.map((color, idx) =>
            productColorsRepo.save(
              productColorsRepo.create({
                product_id: product.id,
                color_id: color,
                rank: idx + 1,
              }),
            ),
          ),
        )

        const colors = await productColorsRepo.find({ product_id: productId })
        product.product_colors = colors
      }

      if (productAddons) {
        await productAddonsRepo.delete({
          product_id: productId,
        })

        // validate product addons belongs to that store or not
        await this.productAddonServive_
          .withTransaction(this.transactionManager_)
          .validateByStore(productAddons, product.store_id)
        product.product_addons = await Promise.all(
          productAddons.map((addon, idx) =>
            productAddonsRepo.save(
              productAddonsRepo.create({
                product_id: productId,
                lv1_id: addon,
                rank: idx + 1,
              }),
            ),
          ),
        )
        const addons = await productAddonsRepo.find({ product_id: productId })
        product.product_addons = addons
      }

      if (shippingOptions) {
        await productShippingOptionsRepo.delete({
          product_id: product.id,
        })

        // validate shipping options belongs to that store or not
        await this.shippingOptionServive_
          .withTransaction(this.transactionManager_)
          .validateByStore(
            shippingOptions.map((s) => s.id),
            product.store_id,
          )

        product.product_shipping_options = await Promise.all(
          shippingOptions.map((opt, idx) =>
            productShippingOptionsRepo.save(
              productShippingOptionsRepo.create({
                product_id: product.id,
                shipping_option_id: opt.id,
                bulk_added_price: opt.bulk_added_price,
                rank: idx + 1,
              }),
            ),
          ),
        )
        const shippingOption = await productShippingOptionsRepo.find({
          product_id: productId,
        })
        product.product_shipping_options = shippingOption
      }

      if (productSpecs) {
        await productSpecsRepo.delete({
          product_id: productId,
        })
        product.product_specs = await Promise.all(
          productSpecs.map((spec, idx) =>
            productSpecsRepo.save(
              productSpecsRepo.create({
                ...spec,
                product_id: productId,
                rank: idx + 1,
              }),
            ),
          ),
        )
        const data = await productSpecsRepo.find({ product_id: productId })
        product.product_specs = data
      }

      if (variants) {
        const currentPriceList = await priceListRepo.findOne({
          where: { name: variants[0].id },
        })

        const currentMoneyAmount = currentPriceList
          ? await moneyAmountRepo.findOne({
              where: {
                variant_id: variants[0].id,
                price_list_id: currentPriceList.id,
              },
              relations: ['price_list'],
            })
          : await moneyAmountRepo.findOne({
              where: {
                variant_id: variants[0].id,
                price_list_id: IsNull(),
              },
            })

        for (const variant of product.variants) {
          const exists = variants.find((v) => v.id && variant.id === v.id)
          if (!exists) {
            await this.productVariantService_
              .withTransaction(manager)
              .softRemove(variant.id)
          }
        }
        const newVariants: ProductVariant[] = []
        for (const [i, newVariant] of variants.entries()) {
          const variant_rank = i

          if (newVariant.id) {
            const variant = product.variants.find((v) => v.id === newVariant.id)

            if (!variant) {
              throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Variant with id: ${newVariant.id} is not associated with this product`,
              )
            }

            const saved = await this.productVariantService_
              .withTransaction(manager)
              .update(variant, {
                ...newVariant,
                variant_rank,
                product_id: product.id,
              })

            newVariants.push(saved as ProductVariant)
          } else {
            // If the provided variant does not have an id, we assume that it
            // should be created
            const created = await this.productVariantService_
              .withTransaction(manager)
              .create(product.id, {
                ...newVariant,
                variant_rank,
                options: newVariant.options || [],
                prices: newVariant.prices || [],
              })

            newVariants.push(created as ProductVariant)
          }
        }
        const data = (await productVariantRepo.find({
          product_id: productId,
        })) as ProductVariant[]
        product.variants = data

        await this.eventBus_
          .withTransaction(manager)
          .emit(ProductSaleService.Events.UPDATE_SALE_PRICE, {
            product_id: productId,
            currentMoneyAmount,
            newPriceList: variants[0].prices,
          })
      }

      if (
        product.status === ProductStatus.DRAFT &&
        rest.status === ProductStatus.PUBLISHED
      ) {
        // update publish_at
        product.created_at = new Date()
      }

      //update released_at
      if (!product.released_at && rest.status === ProductStatus.PUBLISHED) {
        product.released_at = new Date()
      }

      //gen code
      if (product.display_code === '0' && product.type_id) {
        product.display_code = await this.genProdCode(
          product.store_id,
          product.type_id,
        )
      }

      if (display_code && display_code !== product.display_code) {
        const cnt = await productRepo.count({ display_code })
        if (cnt > 0) {
          throw new MedusaError(
            MedusaError.Types.DUPLICATE_ERROR,
            `${display_code} すでに使用されています`,
          )
        }

        product.display_code = display_code
      }

      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== 'undefined') {
          product[key] = value
        }
      }

      product.updated_by = this.container.loggedInUser?.id
      const result = await productRepo.save(product)

      //update delivery_request
      if (result.status === ProductStatus.PUBLISHED) {
        await this.changeStatusByProduct(productId)
      }

      if (oldStatus !== result.status) {
        await this.eventBus_
          .withTransaction(manager)
          .emit(ProductService.Events.STATUS_CHANGE, {
            id: product.id,
            old_status: oldStatus,
            new_status: result.status,
          })
      }

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, {
          id: result.id,
          fields: Object.keys(productObject),
        })

      delete result.margin_rate
      delete result.spec_rate
      delete result.spec_starts_at
      delete result.spec_ends_at

      await this.container.cacheService.invalidate(`prod-detail-${result.id}`)

      return result
    })
  }

  @OnMedusaEntityEvent.Before.Insert(Product, { async: false })
  public async beforeInsertProduct(
    params: MedusaEventHandlerParams<Product, 'Insert'>,
  ): Promise<EntityEventType<Product, 'Insert'>> {
    try {
      const { event } = params
      // const loggedInUser = this.container.loggedInUser

      // make product handle unique => temporary use uuid, slug in the future
      event.entity.handle = uuid()

      return event
    } catch (error) {
      this.logger_.error(error)
      return params.event
    }
  }

  @OnMedusaEntityEvent.Before.Insert(Image, { async: false })
  public async attachStoreToImage(
    params: MedusaEventHandlerParams<Image, 'Insert'>,
  ): Promise<EntityEventType<Image, 'Insert'>> {
    try {
      const { event } = params
      const loggedInUser = this.container.loggedInUser
      if (loggedInUser && loggedInUser.store_id) {
        event.entity.store_id = loggedInUser.store_id
      }
      return event
    } catch (error) {
      this.logger_.error(error)
      return params.event
    }
  }

  prepareListQuery_(
    selector: FilterableProductProps | Selector<MedusaProduct>,
    config: FindProductConfig,
  ): {
    q: string
    relations: (keyof MedusaProduct)[]
    query: FindWithoutRelationsOptions
  } {
    const loggedInUser = Object.keys(this.container).includes('loggedInUser')
      ? this.container.loggedInUser
      : null
    if (loggedInUser) {
      selector['store_id'] = loggedInUser.store_id
    }

    return super.prepareListQuery_(selector, config)
  }

  async decorateFavorite(
    product: Product | ProductDetailRes,
    userId: string,
    tmpUserId: string,
  ) {
    const productFavoriteRepo = this.manager.getCustomRepository(
      this.productFavoriteRepository_,
    )
    const existProduct = userId
      ? await productFavoriteRepo.findOne({
          where: [
            {
              user_id: userId,
              product_id: product.id,
            },
          ],
        })
      : await productFavoriteRepo.findOne({
          where: [
            {
              tmp_user_id: tmpUserId,
              product_id: product.id,
            },
          ],
        })

    if (existProduct) {
      product.is_liked = !!existProduct
    }
    return product
  }

  async convertProductDetail(product: Product): Promise<ProductDetailRes> {
    let result = {} as ProductDetailRes

    const defaultFields = [
      'id',
      'description',
      'remarks',
      'title',
      'created_at',
      'updated_at',
      'like_cnt',
      'ship_after',
      'store_id',
      'metadata',
      'type_id',
      'type_lv1_id',
      'type_lv2_id',
      'thumbnail',
      'gift_cover',
      'is_customizable',
      'is_maker_ship',
      'status',
      'display_id',
      'display_code',
      'ship_from_id',
      'is_free_shipping',
    ]

    result = Object.assign(result, _.pick(product, defaultFields))
    result.ship_from = product.ship_from?.name
    result.is_liked = false
    result.images = product.images.map((image) => {
      const pi = product.product_images.find((i) => i.image_id === image.id)

      return {
        id: image.id,
        url: image.url,
        rank: pi.rank,
      }
    })

    // sorting product images before return
    result.images.sort((image1, image2) => image1.rank - image2.rank)

    result.store = _.pick(product.store, [
      'id',
      'name',
      'store_detail',
      'owner',
      'is_return_guarantee',
      'plan_type',
      'status',
    ])
    result.store.store_detail = _.pick(product.store.store_detail, [
      'id',
      'company_name',
    ])
    result.store.owner = _.pick(product.store.owner, ['id', 'nickname'])
    result.tags = product.tags.map((tag) => ({ id: tag.id, value: tag.value }))

    result.material = _.pick(product.product_material, ['id', 'name'])

    result.specs = product.product_specs

    const colors = product.product_colors.map((color) => ({
      ..._.pick(color, ['color']),
    }))
    result.colors = colors

    const addons = await this.listAddons(product.id)
    result.addons = addons

    const variants: ProductDetailVariantRes[] = product.variants.map(
      (variant) => ({
        ..._.pick(variant, [
          'id',
          'inventory_quantity',
          'sku',
          'title',
          'prices',
          'manage_inventory',
        ]),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        price: variant.calculated_price,
        color: variant.options.find(
          (option) => option.option_id === 'opt_color',
        )?.value,
        size: variant.options.find((option) => option.option_id === 'opt_size')
          ?.value,
      }),
    )
    result.variants = variants

    const shipping_options = await this.listShippingOptions(product.id)
    result.shipping_options = shipping_options

    const fromPrefIds = new Set<string>()

    for (const so of shipping_options) {
      if (!_.isNil(so.data?.all) || !so.metadata?.from_pref_id) {
        !!product?.store.store_detail?.prefecture_id &&
          fromPrefIds.add(product.store.store_detail.prefecture_id)
      } else {
        fromPrefIds.add(so.metadata?.from_pref_id)
      }
    }

    const prefectures = await Promise.all(
      [...fromPrefIds].map(async (id) => {
        const pref = await this.prefectureService_.retrieve(id)
        return pref
      }),
    )

    result.shipping_prefectures = prefectures

    return result
  }

  async convertProductDetailCms(
    product: Product,
  ): Promise<ProductDetailCmsRes> {
    let result = {} as ProductDetailCmsRes

    const defaultFields = [
      'id',
      'description',
      'remarks',
      'title',
      'created_at',
      'updated_at',
      'like_cnt',
      'ship_after',
      'store_id',
      'metadata',
      'type_id',
      'type_lv1_id',
      'type_lv2_id',
      'thumbnail',
      'gift_cover',
      'is_customizable',
      'is_maker_ship',
      'status',
      'margin_rate',
      'spec_rate',
      'spec_starts_at',
      'spec_ends_at',
      'display_id',
      'display_code',
      'ship_from_id',
      'is_return_guarantee',
    ]

    result = Object.assign(result, _.pick(product, defaultFields))
    result.ship_from = product.ship_from?.name
    result.is_liked = false
    result.images = product.images.map((image) => ({
      id: image.id,
      url: image.url,
      metadata: image.metadata,
    }))

    result.store = _.pick(product.store, [
      'id',
      'name',
      'store_detail',
      'owner',
      'customer',
      'display_id',
    ])

    result.store.store_detail = product?.store?.store_detail
      ? _.pick(product.store.store_detail, ['id', 'company_name'])
      : { id: '', company_name: '' }

    result.store.owner = _.pick(product.store.owner, ['id', 'nickname'])
    result.store.customer = _.pick(product.store.customer, ['display_id'])
    result.tags = product.tags.map((tag) => ({ id: tag.id, value: tag.value }))

    result.material = _.pick(product.product_material, ['id', 'name'])

    result.specs = product.product_specs

    result.is_return_guarantee = product.is_return_guarantee

    const colors = product.product_colors.map((color) => ({
      ..._.pick(color, ['color']),
    }))
    result.colors = colors

    const addons = await this.listAddons(product.id)
    result.addons = addons

    const variants: ProductDetailVariantRes[] = product.variants.map(
      (variant) => ({
        ..._.pick(variant, [
          'id',
          'inventory_quantity',
          'sku',
          'title',
          'prices',
          'manage_inventory',
          'varaint_no',
        ]),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        price: variant.calculated_price,
        color: variant.options.find(
          (option) => option.option_id === 'opt_color',
        )?.value,
        size: variant.options.find((option) => option.option_id === 'opt_size')
          ?.value,
      }),
    )
    result.variants = variants

    const shipping_options = await this.listShippingOptions(product.id)
    result.shipping_options = shipping_options

    return result
  }

  async listAddons(productId: string): Promise<ProductDetailAddonRes[]> {
    const product = await this.retrieve(productId, { select: ['id'] })
    const productAddons = await this.productAddonsService_.getProductAddons(
      product.id,
    )

    const res = productAddons.map((pas) => ({
      id: pas.lv1.id,
      name: pas.lv1.name,
      rank: pas.lv1.rank,
      children: pas.lv1.children.map((pasc) => ({
        id: pasc.id,
        name: pasc.name,
        price: pasc.price,
        children: [],
        rank: pasc.rank,
      })),
    }))

    res.sort((a, b) => a.rank - b.rank)

    for (const item of res) {
      item.children.sort((a, b) => a.rank - b.rank)
    }

    return res
  }

  async getTotalProductCategory(storeId: string) {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_,
    )

    const typeRepo = this.manager_.getCustomRepository(
      this.productTypeRepository_,
    )

    const qb = productRepo
      .createQueryBuilder('product')
      .leftJoin('product.variants', 'product_variant')
      .innerJoin('product.store', 'product_store')
      .select(['product.id', 'product.type_id'])
      .where('1 = 1')
      .groupBy('product.id')
      .orderBy('product.type_id')

    qb.andWhere('product.status = :status', { status: ProductStatus.PUBLISHED })

    qb.andWhere(
      '(product.store_id = :storeId OR product_store.url = :storeId)',
      { storeId: storeId },
    )

    qb.having(
      'sum(product_variant.inventory_quantity) > 0 OR sum(CAST(product_variant.manage_inventory as INT)) < count(product.id)',
    )

    const cats = await qb.getRawMany()

    const rs = []

    for (const item of cats) {
      const f = rs.find((e) => e.type_id === item.product_type_id)
      if (!f) {
        rs.push({ type_id: item.product_type_id, total: 1 })
      } else {
        const index = rs.findIndex((e) => e.type_id === item.product_type_id)
        rs[index].total++
      }
    }

    const result = []

    const typeIds = rs.map((i) => i.type_id)

    const types = await typeRepo.find({ id: In(typeIds) })

    types.map((t) => {
      const ob = {}
      ob[`${t.value}`] = rs.find((e) => e.type_id === t.id).total
      result.push(ob)
    })

    return result
  }

  async listShippingOptions(
    productId: string,
  ): Promise<ProductDetailShippingOptionRes[]> {
    const productShippingOptionsRepo = this.manager.getCustomRepository(
      this.productShippingOptionsRepository_,
    )
    const qb = productShippingOptionsRepo.createQueryBuilder('pso')
    qb.leftJoinAndSelect('pso.shipping_option', 'so')
    qb.leftJoinAndSelect('so.provider', 'provider')
    qb.where('pso.product_id = :productId', { productId })
    qb.andWhere('so.status = :status', {
      status: ShippingOptionStatusEnum.ACTIVE,
    })
    qb.orderBy('pso.rank', 'ASC')

    const result = await qb.getMany()
    return result.map((item) => ({
      id: item.shipping_option.id,
      is_trackable: item.shipping_option.is_trackable,
      is_warranty: item.shipping_option.is_warranty,
      name: (item.shipping_option.provider as FulfillmentProvider)?.is_free
        ? item.shipping_option.provider_name
        : (item.shipping_option.provider as FulfillmentProvider).name,
      bulk_added_price: item.bulk_added_price,
      amount: item.shipping_option.amount,
      data: item.shipping_option.data,
      fulfillment: item.shipping_option.provider as FulfillmentProvider,
      rank: item.rank,
      metadata: item.shipping_option.metadata,
    }))
  }

  async checkFavoriteStatus(data: CheckLikeStatusReq): Promise<string[]> {
    const {
      user_id: userId,
      product_ids: productIds,
      tmp_user_id: tmpUserId,
    } = data

    const productFavoriteRepo = this.manager.getCustomRepository(
      this.productFavoriteRepository_,
    )

    const idsSet = new Set<string>(productIds)

    const proFavs = await productFavoriteRepo.find({
      where: [
        {
          user_id: userId,
          product_id: In([...idsSet]),
        },
        {
          tmp_user_id: tmpUserId,
          product_id: In([...idsSet]),
        },
      ],
    })

    return proFavs.map((p) => p.product_id)
  }

  async evaluateProduct(productOrId: string | Product) {
    let product: Product
    const productRepo = this.manager.getCustomRepository(
      this.productRepository_,
    )

    const priceListRepo = this.manager.getCustomRepository(
      this.priceListRepository_,
    )

    const moneyAmountRepo_ = this.manager.getCustomRepository(
      this.moneyAmountRepository_,
    )

    defaultAdminProductRelations.concat('price_list')

    if (typeof productOrId === 'string') {
      product = (await this.retrieve(productOrId, {
        relations: defaultAdminProductRelations,
      })) as Product
    } else {
      product = productOrId
    }

    product.variants = product.variants.filter(
      (v: ProductVariant) => !v.is_deleted,
    )

    const allowedStatuses = [
      ProductStatus.PROPOSED,
      ProductStatus.PUBLISHED,
      ProductStatus.REJECTED,
    ]
    if (!allowedStatuses.includes(product.status)) return

    product.is_soldout = product.variants?.every(
      (variant) => variant.manage_inventory && variant.inventory_quantity === 0,
    )

    await Promise.all(
      product.variants[0].prices.map(async (item) => {
        if (item?.price_list_id) {
          const priceList = await priceListRepo.findOne(item.price_list_id)
          if (priceList) {
            if (product.released_at) {
              if (!priceList?.starts_at && !priceList?.ends_at) {
                priceList.starts_at = new Date(
                  product.released_at.getTime() + SALE_PRODUCT_REQUIRE_DURATION,
                )

                product.sale_price = item.amount
                product.sale_from = priceList.starts_at
                product.sale_to = null

                await priceListRepo.save(priceList)
              }

              if (
                priceList.ends_at &&
                ((priceList?.starts_at &&
                  ((priceList?.starts_at.getTime() <
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION &&
                    priceList.ends_at.getTime() >
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION) ||
                    (!(
                      priceList?.starts_at.getTime() <
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION
                    ) &&
                      priceList.ends_at.getTime() >
                        priceList.starts_at.getTime()))) ||
                  (!priceList?.starts_at &&
                    priceList.ends_at.getTime() >
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION))
              ) {
                if (
                  priceList?.starts_at.getTime() <
                  product.released_at.getTime() + SALE_PRODUCT_REQUIRE_DURATION
                ) {
                  priceList.starts_at = new Date(
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION,
                  )
                  await priceListRepo.save(priceList)
                }

                product.sale_price = item.amount
                product.sale_from = priceList.starts_at
                product.sale_to = priceList.ends_at
              }

              if (
                priceList.ends_at &&
                ((!priceList?.starts_at &&
                  !(
                    priceList.ends_at.getTime() >
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION
                  )) ||
                  (priceList?.starts_at &&
                    ((priceList?.starts_at.getTime() <
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION &&
                      priceList?.ends_at.getTime() <=
                        product.released_at.getTime() +
                          SALE_PRODUCT_REQUIRE_DURATION) ||
                      (!(
                        priceList?.starts_at.getTime() <
                        product.released_at.getTime() +
                          SALE_PRODUCT_REQUIRE_DURATION
                      ) &&
                        !(
                          priceList.ends_at.getTime() >
                          priceList.starts_at.getTime()
                        )))))
              ) {
                item.deleted_at = new Date()
                await moneyAmountRepo_.save(item)
                await priceListRepo.softDelete(item.price_list_id)

                product.sale_price = 0
                product.sale_from = null
                product.sale_to = null
              }

              if (priceList?.starts_at && !priceList?.ends_at) {
                if (
                  priceList?.starts_at.getTime() <
                  product.released_at.getTime() + SALE_PRODUCT_REQUIRE_DURATION
                ) {
                  priceList.starts_at = new Date(
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION,
                  )
                  await priceListRepo.save(priceList)
                }

                product.sale_price = item.amount
                product.sale_from = priceList.starts_at
                product.sale_to = null
              }
            } else {
              product.sale_price = 0
              product.sale_from = null
              product.sale_to = null
            }
          }
        } else {
          product.price = item.amount
          product.sale_price = 0
          product.sale_from = null
          product.sale_to = null
        }
        return product
      }),
    )

    for (let i = 1; i < product.variants.length; i++) {
      const item = product.variants[i]
      for (const j of item.prices) {
        if (j?.price_list_id) {
          const priceList = await priceListRepo.findOne(j.price_list_id)
          if (priceList) {
            if (product.released_at) {
              if (!priceList?.starts_at && !priceList?.ends_at) {
                priceList.starts_at = new Date(
                  product.released_at.getTime() + SALE_PRODUCT_REQUIRE_DURATION,
                )

                await priceListRepo.save(priceList)
              }

              if (
                priceList.ends_at &&
                ((priceList?.starts_at &&
                  ((priceList?.starts_at.getTime() <
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION &&
                    priceList.ends_at.getTime() >
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION) ||
                    (!(
                      priceList?.starts_at.getTime() <
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION
                    ) &&
                      priceList.ends_at.getTime() >
                        priceList.starts_at.getTime()))) ||
                  (!priceList?.starts_at &&
                    priceList.ends_at.getTime() >
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION))
              ) {
                if (
                  priceList?.starts_at.getTime() <
                  product.released_at.getTime() + SALE_PRODUCT_REQUIRE_DURATION
                ) {
                  priceList.starts_at = new Date(
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION,
                  )
                  await priceListRepo.save(priceList)
                }
              }

              if (
                priceList.ends_at &&
                ((!priceList?.starts_at &&
                  !(
                    priceList.ends_at.getTime() >
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION
                  )) ||
                  (priceList?.starts_at &&
                    ((priceList?.starts_at.getTime() <
                      product.released_at.getTime() +
                        SALE_PRODUCT_REQUIRE_DURATION &&
                      priceList?.ends_at.getTime() <=
                        product.released_at.getTime() +
                          SALE_PRODUCT_REQUIRE_DURATION) ||
                      (!(
                        priceList?.starts_at.getTime() <
                        product.released_at.getTime() +
                          SALE_PRODUCT_REQUIRE_DURATION
                      ) &&
                        !(
                          priceList.ends_at.getTime() >
                          priceList.starts_at.getTime()
                        )))))
              ) {
                j.deleted_at = new Date()
                await moneyAmountRepo_.save(j)
                await priceListRepo.softDelete(j.price_list_id)
              }

              if (priceList?.starts_at && !priceList?.ends_at) {
                if (
                  priceList?.starts_at.getTime() <
                  product.released_at.getTime() + SALE_PRODUCT_REQUIRE_DURATION
                ) {
                  priceList.starts_at = new Date(
                    product.released_at.getTime() +
                      SALE_PRODUCT_REQUIRE_DURATION,
                  )
                  await priceListRepo.save(priceList)
                }
              }
            }
          }
        }
      }
    }
    await productRepo.save(product)
    return
  }

  async listByStore_(storeId: string): Promise<Product[]> {
    const proRepo = this.manager_.getCustomRepository(this.productRepository_)
    const sysCon = loadConfig()

    const query: FindManyOptions<Product> = buildQuery({}, {})

    query.where = [{ store_id: storeId }]

    sysCon.app.deletedStatusFlag
      ? (query.where = [
          { store_id: storeId, status: Not(ProductStatusEnum.deleted) },
        ])
      : undefined

    const products = await proRepo.find(query)

    return products
  }

  async changeStatusWithdraw(
    storeId: string,
    isWithdrawal: boolean,
    saveOldStatus = false,
  ) {
    return this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepository_)

      const qb = productRepo.createQueryBuilder()
      await qb
        .update(Product)
        .set({
          old_status: () => {
            if (saveOldStatus) {
              return qb.escape(`status`)
            }
            return qb.escape('old_status')
          },
          // @ts-ignore
          status: isWithdrawal
            ? `${ProductStatusEnum.deleted}`
            : () => qb.escape(`old_status`),
        })
        .where('store_id = :sId', { sId: storeId })
        .execute()
    })
  }

  async getProductName(data: GetProductNameCms) {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_,
    )

    const productFind = await productRepo.findOne(data, {
      select: ['id', 'display_id', 'display_code', 'title'],
    })

    return productFind
  }

  async standardizedVariants(product: MedusaProduct) {
    if (product.variants?.length) {
      product.variants = product.variants.filter(
        (v: ProductVariant) => !v.is_deleted,
      )
    }
    return product
  }

  async changeStatusByProduct(productId: string) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )

      const deliveries = await deliveryRequestRepo.find({
        product_id: productId,
        parent_id: Not(IsNull()),
        admin_status: In([
          DeliveryRequestAdminStatus.ARRIVED,
          DeliveryRequestAdminStatus.MAIN_PRODUCT_REGISTER,
        ]),
      })

      if (!(deliveries?.length > 0)) {
        return
      }

      for (const item of deliveries) {
        await deliveryRequestRepo.update(item.id, {
          admin_status: DeliveryRequestAdminStatus.PUBLISHED,
        })

        await this.addInventory(item.id)

        await this.eventBus_.emit(DeliveryRequestService.Events.UPDATE, {
          id: item.parent_id,
        })
      }
    })
  }

  async addInventory(id: string) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )

      const productVariantRepo = tx.getCustomRepository(
        this.productVariantRepository_,
      )

      const raw = await deliveryRequestVariantRepo.find({
        delivery_request_id: id,
      })

      await Promise.all(
        raw.map(async (dev) => {
          const data = await productVariantRepo.findOne({ id: dev.variant_id })

          let quantity = 0

          if (dev?.different_quantity_flag === true) {
            quantity = dev.different_quantity
          } else {
            quantity = dev.delivery_quantity
          }
          data.inventory_quantity = data.inventory_quantity + quantity

          await productVariantRepo.save(data)
        }),
      )
    })
  }
}
