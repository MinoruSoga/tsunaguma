import {
  EventBusService,
  ProductVariant,
  ReturnStatus as MedusaReturnStatus,
  TransactionBaseService,
} from '@medusajs/medusa'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { ProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import { ReturnItemRepository } from '@medusajs/medusa/dist/repositories/return-item'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
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

import { LineItem } from '../../cart/entity/line-item.entity'
import { Order } from '../../order/entity/order.entity'
import { OrderRepository } from '../../order/repository/order.repository'
import { Product } from '../../product/entity/product.entity'
import ProductRepository from '../../product/repository/product.repository'
import { ReturnDetailCmsRes } from '../controllers/get-detail-return.cms.admin.controller'
import { ReturnRes } from '../controllers/list-returns.admin.controller'
import {
  GetListReturnCmsBody,
  ReturnCmsRes,
} from '../controllers/search-return.cms.admin.controller'
import { Return, ReturnStatus } from '../entities/return.entity'
import { ReturnRepository } from '../repository/return.repository'

type InjectedDependencies = {
  manager: EntityManager
  eventBusService: EventBusService
  logger: Logger
  returnRepository: typeof ReturnRepository
  orderRepository: typeof OrderRepository
  returnItemRepository: typeof ReturnItemRepository
  lineItemRepository: typeof LineItemRepository
  productRepository: typeof ProductRepository
  productVariantRepository: typeof ProductVariantRepository
}

export const defaultReturnRelations = [
  'items',
  'items.item',
  'order',
  'order.store',
]
@Service()
export class ReturnSearchService extends TransactionBaseService {
  static resolutionKey = 'returnSearchService'

  protected transactionManager_: EntityManager
  protected manager_: EntityManager
  protected container_: InjectedDependencies
  protected logger: Logger
  protected evenBus_: EventBusService
  protected returnRepo_: typeof ReturnRepository
  protected orderRepo_: typeof OrderRepository
  protected returnItemRepo_: typeof ReturnItemRepository
  protected lineItemRepo_: typeof LineItemRepository
  protected productRepo_: typeof ProductRepository
  protected productVariantRepo_: typeof ProductVariantRepository

  constructor(container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.evenBus_ = container.eventBusService
    this.logger = container.logger
    this.returnRepo_ = container.returnRepository
    this.orderRepo_ = container.orderRepository
    this.returnItemRepo_ = container.returnItemRepository
    this.lineItemRepo_ = container.lineItemRepository
    this.productRepo_ = container.productRepository
    this.productVariantRepo_ = container.productVariantRepository
  }

  async search(data: GetListReturnCmsBody): Promise<[ReturnCmsRes[], number]> {
    return await this.atomicPhase_(async (tx) => {
      const returnRepo = tx.getCustomRepository(this.returnRepo_)
      const selector: Selector<Return> = {
        status: In([
          MedusaReturnStatus.REQUESTED,
          MedusaReturnStatus.CANCELED,
          MedusaReturnStatus.RECEIVED,
        ]),
      }
      const config: FindConfig<Return> = {
        relations: defaultReturnRelations,
        order: {
          created_at: 'DESC',
        },
      }
      const query = buildQuery(selector, config)

      if (data.display_id) {
        query.where.display_id = data.display_id
      }

      if (data.create_from || data.create_to) {
        const create = await this.checkFromTo(data.create_from, data.create_to)
        if (create === 'dual') {
          query.where.created_at = Between(data.create_from, data.create_to)
        }

        if (create === 'from') {
          query.where.created_at = MoreThanOrEqual(data.create_from)
        }

        if (create === 'to') {
          query.where.created_at = LessThanOrEqual(data.create_to)
        }
      }

      if (data.origin) {
        query.where.origin = data.origin
      }
      if (data.status && data.status !== ReturnStatus.PAUSE) {
        query.where.status = data.status as MedusaReturnStatus
        query.where.is_pause = false
      }
      if (data.status && data.status === ReturnStatus.PAUSE) {
        query.where.is_pause = true
      }

      if (data.ship_from || data.ship_to) {
        const ship = await this.checkFromTo(data.ship_from, data.ship_to)

        if (ship === 'dual') {
          query.where.order = {
            shipped_at: Between(data.ship_from, data.ship_to),
          }
        }

        if (ship === 'from') {
          query.where.order = {
            shipped_at: MoreThanOrEqual(data.ship_from),
          }
        }

        if (ship === 'to') {
          query.where.order = {
            shipped_at: LessThanOrEqual(data.ship_to),
          }
        }
      }

      if (
        data.item_name ||
        data.product_code ||
        data.product_id ||
        data.sku ||
        data.store_id ||
        data.store_name ||
        data.customer_id ||
        data.nickname
      ) {
        const ids = await this.getOrder({
          store_id: data.store_id,
          store_name: data.store_name,
          customer_id: data.customer_id,
          nickname: data.nickname,
          product_code: data.product_code,
          product_id: data.product_id,
          item_name: data.item_name,
          sku: data.sku,
        })

        query.where.order_id = In(ids)
      }

      if (data.limit) {
        query.take = data.limit
      }

      if (data.offset) {
        query.skip = data.offset
      }

      const [raw, count] = await returnRepo.findAndCount(query)

      const result = await Promise.all(
        raw.map(async (i) => {
          return await this.convertReturnResCms(i)
        }),
      )

      return [result, count]
    })
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

  async getOrder(data: {
    store_id?: number
    store_name?: string
    customer_id?: number
    nickname?: string
    product_code?: string
    product_id?: number
    item_name?: string
    sku?: string
  }) {
    return await this.atomicPhase_(async (tx) => {
      const orderRepo = tx.getCustomRepository(this.orderRepo_)

      const selector: Selector<Order> = {
        parent_id: Not(IsNull()),
      }
      const config: FindConfig<Order> = {
        select: ['id'],
        relations: ['store', 'customer'],
        order: {
          created_at: 'DESC',
        },
      }

      const query = buildQuery(selector, config)

      if (data.store_id) {
        query.where.store = {
          display_id: data.store_id,
        }
      }

      if (data.store_name) {
        query.where.store = {
          name: ILike(`%${data.store_name}%`),
        }
      }

      if (data.customer_id) {
        query.where.customer = {
          display_id: data.customer_id,
        }
      }

      if (data.nickname) {
        query.where.customer = {
          nickname: ILike(`%${data.nickname}%`),
        }
      }

      if (data.product_code || data.product_id || data.sku || data.item_name) {
        const ids = await this.getLineItem({
          item_name: data.item_name,
          product_code: data.product_code,
          product_id: data.product_id,
          sku: data.sku,
        })

        query.where.id = In(ids)
      }

      const result = await orderRepo.find(query)

      return result.map((e) => e.id)
    })
  }

  async getLineItem(data: {
    item_name: string
    product_code: string
    product_id: number
    sku: string
  }) {
    return await this.atomicPhase_(async (tx) => {
      const lineItemRepo = tx.getCustomRepository(this.lineItemRepo_)

      const selector: Selector<LineItem> = {}
      const config: FindConfig<LineItem> = {
        select: ['order_id'],
      }

      const query = buildQuery(selector, config)

      if (data.product_code || data.product_id || data.sku) {
        const ids = await this.getVariants({
          product_code: data.product_code,
          product_id: data.product_id,
          sku: data.sku,
        })

        query.where.variant_id = In(ids)
      }

      if (data.item_name) {
        query.where.title = ILike(`%${data.item_name}%`)
      }

      const result = await lineItemRepo.find(query)
      return result.map((e) => e.order_id)
    })
  }

  async getVariants(data: {
    product_code: string
    product_id: number
    sku: string
  }) {
    return await this.atomicPhase_(async (tx) => {
      const productVariantRepo = tx.getCustomRepository(
        this.productVariantRepo_,
      )

      const selector: Selector<ProductVariant> = {}
      const config: FindConfig<ProductVariant> = {
        select: ['id'],
      }

      const query = buildQuery(selector, config)

      if (data.sku) {
        query.where.title = ILike(`%${data.sku}%`)
      }

      if (data.product_code || data.product_id) {
        const dataIds = await this.getProduct({
          product_code: data.product_code,
          product_id: data.product_id,
        })

        query.where.product_id = In(dataIds)
      }

      const result = await productVariantRepo.find(query)
      return result.map((e) => e.id)
    })
  }

  async getProduct(data: { product_code: string; product_id: number }) {
    return await this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)

      const selector: Selector<Product> = {}
      const config: FindConfig<Product> = {
        select: ['id'],
      }

      const query = buildQuery(selector, config)

      if (data.product_code) {
        query.where.display_code = ILike(`%${data.product_code}%`)
      }

      if (data.product_id) {
        query.where.display_id = data.product_id
      }

      const result = await productRepo.find(query)
      return result.map((e) => e.id)
    })
  }

  async convertReturnResCms(data: Return): Promise<ReturnCmsRes> {
    let result = {} as ReturnCmsRes

    result = Object.assign(
      result,
      _.pick(data, [
        'id',
        'status',
        'display_id',
        'created_at',
        'is_pause',
        'origin',
      ]),
    )

    result.items = data.items.map((e) => ({
      ..._.pick(e, [
        'return_id',
        'item_id',
        'quantity',
        'is_requested',
        'requested_quantity',
        'received_quantity',
        'reason_id',
        'note',
        'metadata',
      ]),
      item: {
        ..._.pick(e, ['id', 'title']),
        variant: {
          ..._.pick(e.item.variant, [
            'id',
            'title',
            'sku',
            'inventory_quantity',
          ]),
          product: _.pick(e.item.variant.product, [
            'id',
            'title',
            'display_id',
          ]),
        },
      },
    }))

    result.order = {
      ..._.pick(data.order, ['id', 'display_id', 'create_at']),
      store: _.pick(data.order.store, ['id', 'name']),
    }

    return result
  }

  async listReturns(
    id: string,
    selector: Selector<Return>,
    config: FindConfig<Return>,
  ): Promise<[ReturnRes[], number]> {
    const returnRepo = this.manager_.getCustomRepository(this.returnRepo_)
    const query = buildQuery(selector, config)

    query.where.order = {
      store_id: id,
    }

    query.where.status = In([
      MedusaReturnStatus.REQUESTED,
      MedusaReturnStatus.CANCELED,
      MedusaReturnStatus.RECEIVED,
    ])

    query.relations = ['order', 'items', 'items.item']

    const [raw, count] = await returnRepo.findAndCount(query)

    const result = await Promise.all(
      raw.map(async (i) => {
        return await this.convertReturnRes(i)
      }),
    )

    return [result, count]
  }

  async convertReturnRes(data: Return): Promise<ReturnRes> {
    let result: ReturnRes = {}

    result = Object.assign(
      result,
      _.pick(data, [
        'id',
        'display_id',
        'created_at',
        'status',
        'received_at',
        'refund_amount',
      ]),
    )
    result.items = data.items.map((e) => ({
      ..._.pick(e, [
        'return_id',
        'item_id',
        'quantity',
        'requested_quantity',
        'received_quantity',
      ]),
      item: {
        ..._.pick(e.item, ['id', 'title', 'quantity', 'returned_quantity']),
        variant: {
          ..._.pick(e.item.variant, ['id', 'title', 'inventory_quantity']),
          product: {
            ..._.pick(e.item.variant.product, [
              'id',
              'display_id',
              'display_code',
              'title',
            ]),
          },
        },
      },
    }))

    return result
  }

  async convertReturnDetailResCms(data: Return): Promise<ReturnDetailCmsRes> {
    let result = {} as ReturnDetailCmsRes

    result = Object.assign(
      result,
      _.pick(data, [
        'id',
        'status',
        'display_id',
        'created_at',
        'reason',
        'origin',
        'is_pause',
      ]),
    )

    result.items = data.items.map((e) => ({
      ..._.pick(e, [
        'return_id',
        'item_id',
        'quantity',
        'is_requested',
        'requested_quantity',
        'received_quantity',
        'reason_id',
        'note',
        'metadata',
      ]),
      item: {
        ..._.pick(e, ['id', 'title', 'quantity']),
        variant: {
          ..._.pick(e.item.variant, [
            'id',
            'title',
            'sku',
            'inventory_quantity',
          ]),
          product: _.pick(e.item.variant.product, [
            'id',
            'title',
            'display_id',
          ]),
        },
      },
    }))

    result.order = {
      ..._.pick(data.order, ['id', 'display_id', 'create_at']),
      store: _.pick(data.order.store, ['id', 'display_id', 'name']),
      customer: _.pick(data.order.customer, ['id', 'display_id', 'nickname']),
    }

    return result
  }

  async retrieve(id: string): Promise<ReturnRes> {
    return await this.atomicPhase_(async (tx) => {
      const returnRepo = tx.getCustomRepository(this.returnRepo_)
      const selector: Selector<Return> = {
        id: id,
      }
      const config: FindConfig<Return> = {
        relations: [...defaultReturnRelations, 'order.customer'],
      }
      const query = buildQuery(selector, config)

      const raw = await returnRepo.findOne(query)

      const result = this.convertReturnDetailResCms(raw)
      return result
    })
  }
}
