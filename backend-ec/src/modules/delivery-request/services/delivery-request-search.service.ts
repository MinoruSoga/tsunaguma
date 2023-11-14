import { EventBusService, TransactionBaseService } from '@medusajs/medusa'
import { ProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { Between, EntityManager, ILike, In, IsNull } from 'typeorm'

import ProductRepository from '../../product/repository/product.repository'
import { ProductService } from '../../product/services/product.service'
import { ProductVariantService } from '../../product/services/product-variant.service'
import { Store } from '../../store/entity/store.entity'
import { StoreDetail } from '../../store/entity/store-detail.entity'
import StoreRepository from '../../store/repository/store.repository'
import { StoreDetailRepository } from '../../store/repository/store-detail.repository'
import { User } from '../../user/entity/user.entity'
import UserRepository from '../../user/user.repository'
import {
  DeliveryChildrenRes,
  DeliveryRequestDetailRes,
  SearchDeliveryRequestParams,
} from '../controllers/search/search-delivery-request.cms.admin.controller'
import { DeliveryRequest } from '../entities/delivery-request.entity'
import { DeliveryRequestRepository } from '../repository/delivery-request.repository'
import { DeliveryRequestVariantRepository } from '../repository/delivery-request-variant.repository'

type InjectionDependencies = {
  manager: EntityManager
  logger: Logger
  deliveryRequestRepository: typeof DeliveryRequestRepository
  productService: ProductService
  productVariantService: ProductVariantService
  eventBusService: EventBusService
  productRepository: typeof ProductRepository
  deliveryRequestVariantRepository: typeof DeliveryRequestVariantRepository
  productVariantRepository: typeof ProductVariantRepository
  storeRepository: typeof StoreRepository
  storeDetailRepository: typeof StoreDetailRepository
  userRepository: typeof UserRepository
}

export type SearchByStore = {
  store_id?: number
  store_name?: string
  pref?: string
  addr_01?: string
  store_phone?: string
  company_name?: string
  user_name?: string
  user_id?: number
}

export const defaultDeliveryRequestFields: (keyof DeliveryRequest)[] = [
  'id',
  'status',
  'display_id',
  'created_at',
  'suggested_price',
  'released_at',
  'admin_status',
]

export const defaultDeliveryRequestRelations = [
  'store',
  'store.store_detail',
  'children',
  'children.product',
  'children.product.variants',
  'children.product.variants.requests',
]
@Service()
export class DeliveryRequestSearchService extends TransactionBaseService {
  static resolutionKey = 'deliveryRequestSearchService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected deliveryRequestRepo_: typeof DeliveryRequestRepository
  protected productService_: ProductService
  protected productVariantService_: ProductVariantService
  protected productRepo_: typeof ProductRepository
  protected deliveryRequestVariantRepo_: typeof DeliveryRequestVariantRepository
  protected productVariantRepo_: typeof ProductVariantRepository
  protected storeRepo_: typeof StoreRepository
  protected storeDetailRepo_: typeof StoreDetailRepository
  protected userRepo_: typeof UserRepository

  private eventBus_: EventBusService
  private logger_: Logger

  constructor(container: InjectionDependencies) {
    super(container)

    this.manager_ = container.manager
    this.transactionManager_ = container.manager
    this.logger_ = container.logger
    this.deliveryRequestRepo_ = container.deliveryRequestRepository
    this.productService_ = container.productService
    this.productVariantService_ = container.productVariantService
    this.eventBus_ = container.eventBusService
    this.deliveryRequestVariantRepo_ =
      container.deliveryRequestVariantRepository
    this.productVariantRepo_ = container.productVariantRepository
    this.storeRepo_ = container.storeRepository
    this.storeDetailRepo_ = container.storeDetailRepository
    this.userRepo_ = container.userRepository
  }

  async search(
    data: SearchDeliveryRequestParams,
  ): Promise<[DeliveryRequestDetailRes[], number]> {
    const deliverRequestRepo = this.manager_.getCustomRepository(
      this.deliveryRequestRepo_,
    )

    const selector: Selector<DeliveryRequest> = {}
    const config: FindConfig<DeliveryRequest> = {
      select: defaultDeliveryRequestFields,
      relations: defaultDeliveryRequestRelations,
      order: {
        created_at: 'DESC',
      },
    }
    const query = buildQuery(selector, config)

    if (data.admin_status) {
      query.where.admin_status = data.admin_status
    }

    if (data.display_id) {
      query.where.display_id = data.display_id
    }

    if (data.released_at) {
      const startDay = dayjs(data.released_at)
        .utcOffset(0)
        .startOf('date')
        .toDate()
      const endDay = dayjs(data.released_at).utcOffset(0).endOf('date').toDate()

      query.where.released_at = Between(startDay, endDay)
    }

    if (
      data.store_id ||
      data.store_name ||
      data.pref ||
      data.addr_01 ||
      data.store_phone ||
      data.company_name ||
      data.user_id ||
      data.user_name
    ) {
      let ids = []
      let count = 0

      let ids1 = []
      if (
        data.store_id ||
        data.store_name ||
        data.pref ||
        data.addr_01 ||
        data.store_phone ||
        data.user_name ||
        data.company_name ||
        data.user_id
      ) {
        ids1 = await this.getStoreInfo({
          store_id: data.store_id,
          store_name: data.store_name,
          pref: data.pref,
          addr_01: data.addr_01,
          store_phone: data.store_phone,
          company_name: data.company_name,
          user_name: data.user_name,
          user_id: data.user_id,
        })

        count++
      }

      ids = [].concat(ids1)
      const arr = _.countBy(ids)
      const listIds = []

      for (const key in arr) {
        const element = arr[key]
        if (element === count) {
          listIds.push(key)
        }
      }

      query.where.store_id = In(listIds)
    }

    query.where.parent_id = IsNull()

    query.take = data?.limit || 10

    query.skip = data?.offset || 0

    const [raw, count] = await deliverRequestRepo.findAndCount(query)

    const result = await Promise.all(
      raw.map(async (i) => {
        return await this.convertDeliveryRequestCms(i)
      }),
    )

    return [result, count]
  }

  async getStoreInfo(data: SearchByStore) {
    const storeRepo_ = this.manager_.getCustomRepository(this.storeRepo_)

    const selector: Selector<Store> = {}
    const config: FindConfig<Store> = {
      select: ['id'],
      relations: ['customer'],
      order: {
        created_at: 'DESC',
      },
    }

    const query = buildQuery(selector, config)

    if (data.store_id) {
      query.where.display_id = data.store_id
    }

    if (data.store_name) {
      query.where.name = ILike(`%${data.store_name}%`)
    }

    if (data.store_phone || data.pref || data.addr_01 || data.company_name) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { store_id, store_name, ...rest } = data
      const listIds = await this.getStoreDetail(rest)
      query.where.store_detail_id = In(listIds)
    }

    if (data.user_name) {
      query.where.customer = {
        nickname: ILike(`%${data.user_name}%`),
      }
    }

    if (data.user_id) {
      query.where.customer = {
        display_id: data.user_id,
      }
    }
    const result = await storeRepo_.find(query)

    return result.map((e) => e.id)
  }

  async getStoreDetail(data: {
    pref?: string
    addr_01?: string
    store_phone?: string
    company_name?: string
    user_name?: string
  }) {
    const storeDetailRepo_ = this.manager_.getCustomRepository(
      this.storeDetailRepo_,
    )

    const selector: Selector<StoreDetail> = {}
    const config: FindConfig<StoreDetail> = {
      select: ['id'],
      order: {
        created_at: 'DESC',
      },
    }
    const query = buildQuery(selector, config)

    if (data.pref) {
      query.where.prefecture_id = data.pref
    }

    if (data.addr_01) {
      query.where.addr_01 = ILike(`%${data.addr_01}%`)
    }

    if (data.company_name) {
      query.where.company_name = ILike(`%${data.company_name}%`)
    }

    if (data.store_phone) {
      query.where.tel_number = ILike(`%${data.store_phone}%`)
    }

    const result = await storeDetailRepo_.find(query)

    return result.map((e) => e.id)
  }

  getStoreWithName = async (userName: string) => {
    const storeDetailRepo = this.manager_.getCustomRepository(
      this.storeDetailRepo_,
    )
    const qb = storeDetailRepo.createQueryBuilder('store_detail')
    qb.select('store_detail.id')
    qb.andWhere(
      "(CONCAT(upper(store_detail.firstname), ' ', upper(store_detail.lastname)) LIKE :userName OR CONCAT(upper(store_detail.firstname), upper(store_detail.lastname)) LIKE :userName)",
      { userName: `%${userName.toUpperCase()}%` },
    )
    const result = await qb.getMany()
    return [...new Set(result.map((r) => r.id).filter((v) => !!v))]
  }

  async getStoreWithUser(userId: number) {
    const userRepo_ = this.manager_.getCustomRepository(this.userRepo_)

    const selector: Selector<User> = {}
    const config: FindConfig<User> = {
      select: ['store_id'],
      relations: ['customer'],
      order: {
        created_at: 'DESC',
      },
    }

    const query = buildQuery(selector, config)

    if (userId) {
      query.where.customer = {
        display_id: userId,
      }
    }

    const result = await userRepo_.find(query)

    return result.map((e) => e.store_id)
  }

  async convertDeliveryRequestCms(
    data: DeliveryRequest,
  ): Promise<DeliveryRequestDetailRes> {
    let result = {} as DeliveryRequestDetailRes

    result = Object.assign(result, _.pick(data, defaultDeliveryRequestFields))

    result.store = _.pick(data.store, ['id', 'name', 'store_detail'])
    result.store.store_detail = _.pick(data.store?.store_detail, [
      'id',
      'prefecture_id',
      'addr_01',
      'tel_number',
    ])

    const children: DeliveryChildrenRes[] = data.children.map((e) => ({
      ..._.pick(e, [
        'id',
        'created_at',
        'display_id',
        'suggested_price',
        'total_stock',
        'released_at',
        'admin_status',
      ]),
      product: {
        ..._.pick(e.product, [
          'id',
          'title',
          'display_code',
          'display_id',
          'variants',
        ]),
        variants: e.product.variants.map((val) => ({
          ..._.pick(val, ['id', 'title', 'requests']),
        })),
      },
    }))

    result.children = children

    return result
  }
}
