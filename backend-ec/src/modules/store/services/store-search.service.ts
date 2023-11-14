import { ProductStatus, TransactionBaseService } from '@medusajs/medusa'
import { CurrencyRepository } from '@medusajs/medusa/dist/repositories/currency'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { Order } from 'src/modules/order/entity/order.entity'
import {
  Between,
  EntityManager,
  ILike,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm'

import loadConfig from '../../../helpers/config'
import { CARRY_OVER } from '../../../helpers/constant'
import { OrderRepository } from '../../order/repository/order.repository'
import { Product } from '../../product/entity/product.entity'
import { ProductReviews } from '../../product/entity/product-reviews.entity'
import { ProductVariant } from '../../product/entity/product-variant.entity'
import ProductRepository from '../../product/repository/product.repository'
import { ProductReviewsRepository } from '../../product/repository/product-reviews.repository'
import { User } from '../../user/entity/user.entity'
import { CustomerRepository } from '../../user/repository/customer.repository'
import UserRepository from '../../user/user.repository'
import {
  defaultCmsStoreRelations,
  GetListStoreCmsBody,
} from '../controllers/get-store-list.cms.admin.controller'
import { Store, StoreStatus } from '../entity/store.entity'
import StoreRepository from '../repository/store.repository'
import { StoreBillingRepository } from '../repository/store-billing.repository'
import { StoreDetailRepository } from '../repository/store-detail.repository'
import { StoreFavoriteRepository } from './../../favorite/repository/store-favorite.repository'
import { SeqService } from './../../seq/seq.service'
import { StoreDetailService } from './store-detail.service'

interface InjectedDependencies {
  loggedInUser?: User
  manager: EntityManager
  storeRepository: typeof StoreRepository
  storeDetailRepository: typeof StoreDetailRepository
  currencyRepository: typeof CurrencyRepository
  storeBillingRepository: typeof StoreBillingRepository
  eventBusService: EventBusService
  userRepository: typeof UserRepository
  storeDetailService: typeof StoreDetailService
  logger: Logger
  storeFavoriteRepository: typeof StoreFavoriteRepository
  customerRepository: typeof CustomerRepository
  seqService: SeqService
  productRepository: typeof ProductRepository
  orderRepository: typeof OrderRepository
  productReviewsRepository: typeof ProductReviewsRepository
}

@Service()
export class StoreSearchService extends TransactionBaseService {
  protected manager_: EntityManager
  static resolutionKey = 'storeSearchService'
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected readonly productRepo: typeof ProductRepository
  protected readonly storeRepository: typeof StoreRepository
  protected readonly storeDetailRepository: typeof StoreDetailRepository
  protected readonly storeBillingRepository: typeof StoreBillingRepository
  protected readonly userRepository: typeof UserRepository
  protected readonly storeFavoriteRepository: typeof StoreFavoriteRepository
  protected logger: Logger
  protected readonly storeDetailService: typeof StoreDetailService
  protected readonly customerRepository: typeof CustomerRepository
  protected evenBus_: EventBusService
  protected readonly seqService: SeqService
  protected readonly orderRepository: typeof OrderRepository
  protected readonly productReviewsRepo_: typeof ProductReviewsRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.storeRepository = container.storeRepository
    this.storeDetailRepository = container.storeDetailRepository
    this.storeBillingRepository = container.storeBillingRepository
    this.userRepository = container.userRepository
    this.storeFavoriteRepository = container.storeFavoriteRepository
    this.storeDetailService = container.storeDetailService
    this.seqService = container.seqService
    this.customerRepository = container.customerRepository
    this.evenBus_ = container.eventBusService
    this.logger = container.logger
    this.productRepo = container.productRepository
    this.orderRepository = container.orderRepository
    this.productReviewsRepo_ = container.productReviewsRepository
  }

  public async searchStoreCms(data: GetListStoreCmsBody) {
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository)

    const selector: Selector<Store> = {}
    const config: FindConfig<Store> = {}
    config.relations = defaultCmsStoreRelations
    config.select = [
      'id',
      'name',
      'plan_type',
      'status',
      'owner_id',
      'store_detail_id',
      'slug',
      'avatar',
      'free_ship_amount',
      'display_id',
      'business_form',
      'created_at',
    ]
    config.order = { display_id: 'DESC' }

    data.limit ? (config.take = data.limit) : ''
    data.offset ? (config.skip = data.offset) : ''

    const query = buildQuery(selector, config)
    query.where.owner_id = Not(IsNull())

    data.name ? (query.where.name = ILike(`%${data.name}%`)) : ''

    data.account_number
      ? (query.where.payback_setting = { account_number: data.account_number })
      : ''

    if (
      data.company_official_name ||
      data.registration_number ||
      data.company_name ||
      data.company_name_kana ||
      data.payment_method ||
      data.furigana
    ) {
      const ob = Object()

      data.company_official_name
        ? (ob.company_official_name = ILike(`%${data.company_official_name}%`))
        : ''

      data.registration_number
        ? (ob.registration_number = ILike(`%${data.registration_number}%`))
        : ''

      data.company_name
        ? (ob.company_name = ILike(`%${data.company_name}%`))
        : ''

      data.company_name_kana
        ? (ob.company_name_kana = ILike(`%${data.company_name_kana}%`))
        : ''

      data.payment_method ? (ob.payment_method = In(data.payment_method)) : ''

      query.where.store_detail = ob
    }

    if (data.owner_id || data.nickname) {
      const ob = Object()

      data.owner_id ? (ob.customer = { display_id: data.owner_id }) : ''

      data.nickname ? (ob.nickname = ILike(`%${data.nickname}%`)) : ''

      query.where.owner = ob
    }

    data.id ? (query.where.display_id = data.id) : ''

    data.status ? (query.where.status = In(data.status)) : ''

    data.business_form
      ? (query.where.business_form = In(data.business_form))
      : ''

    const numberFollower = await this.checkRange(
      data.number_followers_from,
      data.number_followers_to,
    )

    numberFollower === 'dual'
      ? (query.where.follow_cnt = Between(
          data.number_followers_from,
          data.number_followers_to,
        ))
      : ''

    numberFollower === 'from'
      ? (query.where.follow_cnt = MoreThanOrEqual(data.number_followers_from))
      : ''

    numberFollower === 'to'
      ? (query.where.follow_cnt = LessThanOrEqual(data.number_followers_to))
      : ''

    const marginRate = await this.checkRange(
      data.margin_rate_from,
      data.margin_rate_to,
    )

    marginRate === 'dual'
      ? (query.where.margin_rate = Between(
          data.margin_rate_from,
          data.margin_rate_to,
        ))
      : ''

    marginRate === 'from'
      ? (query.where.margin_rate = MoreThanOrEqual(data.margin_rate_from))
      : ''

    marginRate === 'to'
      ? (query.where.margin_rate = LessThanOrEqual(data.margin_rate_to))
      : ''

    data.is_return_guarantee
      ? (query.where.is_return_guarantee = data.is_return_guarantee)
      : ''

    data.approve === false ? (query.where.status = StoreStatus.PENDING) : ''

    data.plan_type ? (query.where.plan_type = In(data.plan_type)) : ''

    if (
      data.url ||
      data.eval_score_from !== undefined ||
      data.eval_score_to !== undefined ||
      data.number_product_from !== undefined ||
      data.number_product_to !== undefined ||
      data.final_update_from ||
      data.final_update_to ||
      data.number_sale_from !== undefined ||
      data.number_sale_to !== undefined ||
      data.sale_price_from !== undefined ||
      data.sale_price_to !== undefined ||
      data.last_sale_from ||
      data.last_sale_to ||
      data.type_id ||
      data.type_lv1_id ||
      data.type_lv2_id ||
      data.furigana ||
      data.carry_over?.length === 1
    ) {
      let ids = []
      let count = 0

      let ids1 = []
      if (
        data.number_product_from !== undefined ||
        data.number_product_to !== undefined
      ) {
        ids1 = await this.getStoreByNumberPro(
          data.number_product_from,
          data.number_product_to,
        )
        count++
      }

      let ids2 = []
      if (data.final_update_from || data.final_update_to) {
        ids2 = await this.getStoreWithFinalUpdate(
          data.final_update_from,
          data.final_update_to,
        )
        count++
      }

      let ids3 = []
      if (
        data.number_sale_from !== undefined ||
        data.number_sale_to !== undefined
      ) {
        ids3 = await this.getStoreWithNumberSale(
          data.number_sale_from,
          data.number_sale_to,
        )
        count++
      }

      let ids4 = []
      if (
        data.sale_price_from !== undefined ||
        data.sale_price_to !== undefined
      ) {
        ids4 = await this.getStoreWithSaleAmount(
          data.sale_price_from,
          data.sale_price_to,
        )
        count++
      }

      let ids5 = []
      if (data.last_sale_from || data.last_sale_to) {
        ids5 = await this.getStoreWithSaleTime(
          data.last_sale_from,
          data.last_sale_to,
        )
        count++
      }

      let ids6 = []
      if (data.type_id || data.type_lv1_id || data.type_lv2_id) {
        ids6 = await this.getStoreWithCategory(
          data.type_id,
          data.type_lv1_id,
          data.type_lv2_id,
        )
        count++
      }

      let ids7 = []
      if (data.furigana) {
        ids7 = await this.getStoreWithFurigana(data.furigana)
        count++
      }

      let ids8 = []
      if (
        data.eval_score_from !== undefined ||
        data.eval_score_to !== undefined
      ) {
        ids8 = await this.getStoreWithEvalScore(
          data.eval_score_from,
          data.eval_score_to,
        )
        count++
      }

      let ids9 = []
      if (data.carry_over?.length === 1) {
        ids9 = await this.getStoreWithCarryOver(data.carry_over[0])
        count++
      }

      let ids10 = []
      if (data.url) {
        ids10 = await this.getStoreFromUrl(data.url)
        count++
      }

      ids = [].concat(
        ids1,
        ids2,
        ids3,
        ids4,
        ids5,
        ids6,
        ids7,
        ids8,
        ids9,
        ids10,
      )
      const arr = _.countBy(ids)
      const listIds = []

      for (const key in arr) {
        const element = arr[key]
        if (element === count) {
          listIds.push(key)
        }
      }
      query.where.id = In(listIds)
    }

    return await storeRepo.findAndCount(query)
  }

  async checkRange(from: number, to: number) {
    if (from !== undefined && to !== undefined) {
      return 'dual'
    } else if (from !== undefined) {
      return 'from'
    } else if (to !== undefined) {
      return 'to'
    }
    return 'none'
  }

  async checkFromTo(from: string, to: string) {
    if (from && to) {
      return 'dual'
    } else if (from) {
      return 'from'
    } else if (to) {
      return 'to'
    }
    return 'none'
  }

  async getStoreByNumberPro(from: number, to: number) {
    const selector: Selector<Product> = { status: ProductStatus.PUBLISHED }
    const config: FindConfig<Product> = {}

    config.relations = ['variants']
    config.select = ['id', 'store_id']

    const prodRepo = this.manager_.getCustomRepository(this.productRepo)

    const numberPro = await this.checkRange(from, to)

    const query = buildQuery(selector, config)

    const products = await prodRepo.find(query)

    products.map(async (e: Product) => {
      e = await this.standardizedVariants(e)
      return e
    })

    for (const pro of products) {
      let stock_quantity = 0

      if (pro.variants) {
        stock_quantity += pro.variants.length
      }
      pro.stock_quantity = stock_quantity
    }

    const rs = []
    for (const pro of products) {
      let stock_quantity = 0
      const find = rs.find((e) => e.store_id === pro.store_id)
      if (!find) {
        for (const item of products) {
          if (pro.store_id === item.store_id) {
            stock_quantity += item.stock_quantity
          }
        }
        rs.push({ store_id: pro.store_id, stock_quantity: stock_quantity })
      }
    }

    const result = []
    for (const item of rs) {
      numberPro === 'dual'
        ? item.stock_quantity >= from && item.stock_quantity <= to
          ? result.push(item.store_id)
          : ''
        : ''

      numberPro === 'from'
        ? item.stock_quantity >= from
          ? result.push(item.store_id)
          : ''
        : ''

      numberPro === 'to'
        ? item.stock_quantity <= to
          ? result.push(item.store_id)
          : ''
        : ''
    }

    return result
  }

  async getStoreWithNumberSale(from: number, to: number) {
    const selector: Selector<Product> = {
      status: ProductStatus.PUBLISHED,
      sale_price: Not(IsNull()),
    }
    const config: FindConfig<Product> = {}

    config.relations = ['variants']
    config.select = ['id', 'store_id']

    const prodRepo = this.manager_.getCustomRepository(this.productRepo)

    const numberPro = await this.checkRange(from, to)

    const query = buildQuery(selector, config)

    const products = await prodRepo.find(query)

    products.map(async (e: Product) => {
      e = await this.standardizedVariants(e)
      return e
    })

    const rs = []
    for (const pro of products) {
      let numberSale = 0
      const find = rs.find((e) => e.store_id === pro.store_id)
      if (!find) {
        for (const item of products) {
          if (pro.store_id === item.store_id) {
            numberSale += 1
          }
        }
        rs.push({ store_id: pro.store_id, number_sale: numberSale })
      }
    }

    const result = []
    for (const item of rs) {
      numberPro === 'dual'
        ? item.number_sale >= from && item.number_sale <= to
          ? result.push(item.store_id)
          : ''
        : ''

      numberPro === 'from'
        ? item.number_sale >= from
          ? result.push(item.store_id)
          : ''
        : ''

      numberPro === 'to'
        ? item.number_sale <= to
          ? result.push(item.store_id)
          : ''
        : ''
    }

    return result
  }

  async getStoreWithSaleAmount(from: number, to: number) {
    const selector: Selector<Product> = {
      status: ProductStatus.PUBLISHED,
    }
    const config: FindConfig<Product> = {}

    config.relations = ['variants']
    config.select = ['id', 'store_id']

    const prodRepo = this.manager_.getCustomRepository(this.productRepo)

    const saleAmount = await this.checkRange(from, to)

    const query = buildQuery(selector, config)

    saleAmount === 'dual' ? (query.where.sale_price = Between(from, to)) : ''

    saleAmount === 'from'
      ? (query.where.sale_price = MoreThanOrEqual(from))
      : ''

    saleAmount === 'to' ? (query.where.sale_price = LessThanOrEqual(to)) : ''

    const products = await prodRepo.find(query)

    const rs = []
    for (const pro of products) {
      const find = rs.find((e) => e === pro.store_id)
      if (!find) {
        rs.push(pro.store_id)
      }
    }

    return rs
  }

  async getStoreWithSaleTime(from: string, to: string) {
    const selector: Selector<Order> = {
      parent_id: Not(IsNull()),
    }
    const config: FindConfig<Order> = {}

    config.select = ['id', 'store_id']

    const orderRepo = this.manager_.getCustomRepository(this.orderRepository)

    const saleTime = await this.checkFromTo(from, to)

    const query = buildQuery(selector, config)

    saleTime === 'dual' ? (query.where.created_at = Between(from, to)) : ''

    saleTime === 'from' ? (query.where.created_at = MoreThanOrEqual(from)) : ''

    saleTime === 'to' ? (query.where.created_at = LessThanOrEqual(to)) : ''

    const products = await orderRepo.find(query)

    const rs = []
    for (const pro of products) {
      const find = rs.find((e) => e === pro.store_id)
      if (!find) {
        rs.push(pro.store_id)
      }
    }

    return rs
  }

  async getStoreWithFinalUpdate(from: string, to: string) {
    const prodRepo = this.manager_.getCustomRepository(this.productRepo)

    const query = prodRepo
      .createQueryBuilder('product')
      .where({ status: Not(ProductStatus.DRAFT) })
      .groupBy('product.store_id')
      .select(['MAX(product.updated_at) as final_updated', 'store_id'])

    const timeUpdate = await this.checkFromTo(from, to)

    timeUpdate === 'dual'
      ? query.having('MAX(product.updated_at) between :from and :to', {
          from,
          to,
        })
      : ''

    timeUpdate === 'from'
      ? query.having('MAX(product.updated_at) >= :from', {
          from,
        })
      : ''

    timeUpdate === 'to'
      ? query.having('MAX(product.updated_at) <= :to', {
          to,
        })
      : ''

    const result = await query.getRawMany()

    return result.map((e) => e.store_id)
  }

  async getStoreWithCategory(typeId: string, lv1Id: string, lv2Id: string) {
    const selector: Selector<Product> = {
      status: ProductStatus.PUBLISHED,
    }
    const config: FindConfig<Product> = {}

    config.select = ['id', 'store_id']

    const prodRepo = this.manager_.getCustomRepository(this.productRepo)

    const query = buildQuery(selector, config)

    typeId ? (query.where.type_id = typeId) : ''

    lv1Id ? (query.where.type_lv1_id = lv1Id) : ''

    lv2Id ? (query.where.type_lv2_id = lv2Id) : ''

    const products = await prodRepo.find(query)

    const rs = []
    for (const pro of products) {
      const find = rs.find((e) => e === pro.store_id)
      if (!find) {
        rs.push(pro.store_id)
      }
    }

    return rs
  }

  getStoreWithFurigana = async (furigana: string) => {
    const storeRepo = this.manager_.getCustomRepository(
      this.storeDetailRepository,
    )
    const qb = storeRepo.createQueryBuilder('store_detail')
    qb.andWhere(
      "(CONCAT(store_detail.firstname_kana, ' ', store_detail.lastname_kana) LIKE :furigana OR CONCAT(store_detail.firstname_kana, store_detail.lastname_kana) LIKE :furigana)",
      { furigana: `%${furigana}%` },
    )
    const result = await qb.getMany()
    return [...new Set(result.map((r) => r.id).filter((v) => !!v))]
  }

  async getRatePreview(storeId: string) {
    const productReviewRepository = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )
    const selector: Selector<ProductReviews> = {}

    const productRepo = this.manager_.getCustomRepository(this.productRepo)
    let product = await productRepo
      .createQueryBuilder('product')
      .select('product.id')
      .where('store_id = :storeId', { storeId: storeId })
      .getRawMany()

    product = product.map((item) => {
      return item['product_id']
    })

    const query = buildQuery(selector, {} as FindConfig<ProductReviews>)
    query.where = [{ product_id: In(product), parent_id: null }]

    const [reviewStores, total] = await productReviewRepository.findAndCount(
      query,
    )
    const rate = _.round(
      reviewStores.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.rate
      }, 0) / total,
      1,
    )

    return rate
  }

  async getStoreWithEvalScore(from: number, to: number) {
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository)

    const query = buildQuery({}, { select: ['id'] })

    const stores = await storeRepo.find(query)

    const result = []
    await Promise.all(
      stores.map(async (store) => {
        const rate = await this.getRatePreview(store.id)
        const rCheck = await this.checkRange(from, to)
        rCheck === 'dual'
          ? rate >= from && rate <= to
            ? result.push(store.id)
            : undefined
          : undefined

        rCheck === 'from'
          ? rate >= from
            ? result.push(store.id)
            : undefined
          : undefined

        rCheck === 'to'
          ? rate <= to
            ? result.push(store.id)
            : undefined
          : undefined
      }),
    )

    return result
  }

  async standardizedVariants(product: Product) {
    if (product.variants?.length) {
      product.variants = product.variants.filter(
        (v: ProductVariant) => !v.is_deleted,
      )
    }
    return product
  }

  async getStoreWithCarryOver(over: string) {
    const selector: Selector<Product> = { status: ProductStatus.PUBLISHED }
    const config: FindConfig<Product> = {}

    config.relations = ['variants']
    config.select = ['id', 'store_id']

    const prodRepo = this.manager_.getCustomRepository(this.productRepo)

    const query = buildQuery(selector, config)

    const products = await prodRepo.find(query)

    products.map(async (e: Product) => {
      e = await this.standardizedVariants(e)
      return e
    })

    for (const pro of products) {
      let stock_quantity = 0

      if (pro.variants) {
        pro.variants.forEach((item) => {
          stock_quantity += item.inventory_quantity
        })
      }
      pro.stock_quantity = stock_quantity
    }

    const rs = []

    for (const pro of products) {
      let stock_quantity = 0
      const find = rs.find((e) => e.store_id === pro.store_id)
      if (!find) {
        for (const item of products) {
          if (pro.store_id === item.store_id) {
            stock_quantity += item.stock_quantity
          }
        }
        rs.push({ store_id: pro.store_id, stock_quantity: stock_quantity })
      }
    }

    const result = []
    for (const item of rs) {
      over === 'true'
        ? item.stock_quantity >= CARRY_OVER
          ? result.push(item.store_id)
          : ''
        : over === 'false'
        ? item.stock_quantity < CARRY_OVER
          ? result.push(item.store_id)
          : ''
        : ''
    }
    return result
  }

  async getStoreFromUrl(url: string): Promise<string[]> {
    const config = loadConfig()
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository)

    const qr = storeRepo
      .createQueryBuilder('s')
      .select('s.id')
      .where(
        `concat('${config.frontendUrl.base}', '/shop-detail/', url)  LIKE '%${url}%'`,
      )

    const stores = await qr.getMany()

    if (stores?.length < 1) {
      return []
    }

    return stores.map((e) => e.id)
  }
}
