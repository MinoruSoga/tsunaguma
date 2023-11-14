import { TransactionBaseService } from '@medusajs/medusa'
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
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm'

import { notAllowedGetMyProductStatuses } from '../../../modules/product/constant'
import { Product } from '../../product/entity/product.entity'
import { ProductVariant } from '../../product/entity/product-variant.entity'
import ProductRepository from '../../product/repository/product.repository'
import { ProductVariantRepository } from '../../product/repository/product-variant.repository'
import { Store, StorePlanType } from '../../store/entity/store.entity'
import StoreRepository from '../../store/repository/store.repository'
import { Customer } from '../../user/entity/customer.entity'
import { UserStatus, UserType } from '../../user/entity/user.entity'
import { CustomerRepository } from '../../user/repository/customer.repository'
import UserRepository from '../../user/user.repository'
import { SearchReturnDeliveriesBody } from '../controllers/search-return-delivery.cms.admin.controller'
import {
  ReturnDelivery,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'
import { ReturnDeliveryRepository } from '../repository/return-delivery.repository'

type InjectedDependencies = {
  manager: EntityManager
  returnDeliveryRepository: typeof ReturnDeliveryRepository
  logger: Logger
  productRepository: typeof ProductRepository
  productVariantRepository: typeof ProductVariantRepository
  storeRepository: typeof StoreRepository
  customerRepository: typeof CustomerRepository
  userRepository: typeof UserRepository
}

@Service()
export class ReturnDeliverySearchService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'returnDeliverySearchService'
  protected readonly returnDeliveryRepo_: typeof ReturnDeliveryRepository
  protected readonly storeRepo_: typeof StoreRepository
  protected readonly customerRepo_: typeof CustomerRepository
  protected readonly productRepo_: typeof ProductRepository
  protected readonly productVariantRepo_: typeof ProductVariantRepository
  protected readonly userRepo_: typeof UserRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.returnDeliveryRepo_ = container.returnDeliveryRepository
    this.storeRepo_ = container.storeRepository
    this.customerRepo_ = container.customerRepository
    this.productRepo_ = container.productRepository
    this.productVariantRepo_ = container.productVariantRepository
    this.userRepo_ = container.userRepository
  }

  async search(
    data: SearchReturnDeliveriesBody,
  ): Promise<[ReturnDelivery[], number]> {
    return await this.atomicPhase_(async (tx) => {
      const returnDeliveryRepo = tx.getCustomRepository(
        this.returnDeliveryRepo_,
      )
      const selector: Selector<ReturnDelivery> = {}
      const config: FindConfig<ReturnDelivery> = {
        relations: ['variant', 'store', 'store.customer'],
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

      if (data.status && data.status !== ReturnDeliveryStatus.PAUSE) {
        query.where.status = data.status
        query.where.is_pause = false
      }
      if (data.status && data.status === ReturnDeliveryStatus.PAUSE) {
        query.where.is_pause = true
      }

      if (data.ship_from || data.ship_to) {
        const ship = await this.checkFromTo(data.ship_from, data.ship_to)

        if (ship === 'dual') {
          query.where.shipped_at = Between(data.ship_from, data.ship_to)
        }

        if (ship === 'from') {
          query.where.shipped_at = MoreThanOrEqual(data.ship_from)
        }

        if (ship === 'to') {
          query.where.shipped_at = LessThanOrEqual(data.ship_to)
        }
      }

      if (
        data.product_name ||
        data.product_code ||
        data.product_id ||
        data.sku
      ) {
        const ids = await this.getVariants({
          product_name: data.product_name,
          product_code: data.product_code,
          product_id: data.product_id,
          sku: data.sku,
        })
        query.where.variant_id = In(ids)
      }

      if (
        data.store_id ||
        data.store_name ||
        data.customer_id ||
        data.nickname
      ) {
        let ids1: string[],
          ids2: string[],
          count = 0
        if (data.store_id || data.store_name) {
          ids1 = await this.getStore({
            store_id: data.store_id,
            store_name: data.store_name,
          })
          count++
        }
        if (data.customer_id || data.nickname) {
          ids2 = await this.getStoreWithCustomer({
            customer_id: data.customer_id,
            nickname: data.nickname,
          })
          count++
        }

        const ids = [].concat(ids1, ids2)
        const idss = _.countBy(ids)

        const storeIds = []
        for (const key in idss) {
          if (idss[key] === count) {
            storeIds.push(key)
          }
        }
        query.where.store_id = In(storeIds)
      }

      if (data.limit) {
        query.take = data.limit
      }

      if (data.offset) {
        query.skip = data.offset
      }

      return await returnDeliveryRepo.findAndCount(query)
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

  async getStoreWithCustomer(data: {
    customer_id?: number
    nickname?: string
  }) {
    return await this.atomicPhase_(async (tx) => {
      const customerRepo = tx.getCustomRepository(this.customerRepo_)
      const userRepo = tx.getCustomRepository(this.userRepo_)
      const cqr = buildQuery({} as Selector<Customer>, {
        order: { created_at: 'DESC' },
      })

      if (data.customer_id) {
        cqr.where.display_id = data.customer_id
      }

      if (data.nickname) {
        cqr.where.nickname = ILike(`%${data.nickname}%`)
      }

      const customers = await customerRepo.find(cqr)

      if (customers?.length < 1) {
        return []
      }

      const users = await userRepo.find({
        id: In(customers.map((e) => e.id)),
        type: UserType.STORE_PRIME,
        status: UserStatus.ACTIVE,
      })

      if (users?.length < 1) {
        return []
      }

      return users.map((e) => e.store_id)
    })
  }

  async getStore(data: { store_id?: number; store_name?: string }) {
    return await this.atomicPhase_(async (tx) => {
      const storeRepo = tx.getCustomRepository(this.storeRepo_)

      const sqr = buildQuery(
        {
          plan_type: StorePlanType.PRIME,
        } as Selector<Store>,
        {
          order: { created_at: 'DESC' },
        },
      )

      if (data.store_id) {
        sqr.where.display_id = data.store_id
      }

      if (data.store_name) {
        sqr.where.name = ILike(`%${data.store_name}%`)
      }

      const stores = await storeRepo.find(sqr)

      if (stores?.length < 1) {
        return
      }

      return stores.map((e) => e.id)
    })
  }

  async getVariants(data: {
    product_code?: string
    product_id?: number
    product_name?: string
    sku?: string
  }) {
    return await this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)
      const productVariantRepo = tx.getCustomRepository(
        this.productVariantRepo_,
      )

      const pqr = buildQuery(
        {
          status: Not(In(notAllowedGetMyProductStatuses)),
        } as Selector<Product>,
        {
          order: { created_at: 'DESC' },
        },
      )

      if (data.product_code) {
        pqr.where.display_code = data.product_code
      }

      if (data.product_id) {
        pqr.where.display_id = data.product_id
      }

      if (data.product_name) {
        pqr.where.title = ILike(`%${data.product_name}%`)
      }

      const products = await productRepo.find(pqr)

      if (products?.length < 1) {
        return []
      }

      const pvqr = buildQuery(
        {
          is_deleted: false,
          product_id: In(products.map((e) => e.id)),
        } as Selector<ProductVariant>,
        {
          order: { created_at: 'DESC' },
        },
      )

      if (data.sku) {
        pvqr.where.sku = ILike(`%${data.sku}%`)
      }

      const variants = await productVariantRepo.find(pvqr)

      if (variants?.length < 1) {
        return []
      }
      return variants.map((e) => e.id)
    })
  }
}
