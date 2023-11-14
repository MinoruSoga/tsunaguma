import { ProductStatus, TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
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

import loadConfig from '../../../helpers/config'
import UserRepository from '../../user/user.repository'
import { notAllowedGetMyProductStatuses } from '../constant'
import { GetProductCmsBody } from '../controllers/get-list-products.cms.admin.controller'
import { Product } from '../entity/product.entity'
import { ProductVariant } from '../entity/product-variant.entity'
import ProductRepository from '../repository/product.repository'

type InjectedDependencies = {
  manager: EntityManager
  productRepository: typeof ProductRepository
  userRepository: typeof UserRepository
}
@Service()
export class ProductSearchCmsService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'productSearchCmsService'
  protected productRepository_: typeof ProductRepository
  protected userRepository_: typeof UserRepository

  constructor(container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.productRepository_ = container.productRepository
    this.userRepository_ = container.userRepository
  }

  async listProducts(data?: GetProductCmsBody): Promise<[Product[], number]> {
    const proRepo = this.manager_.getCustomRepository(this.productRepository_)

    const selector: Selector<Product> = {}
    const config: FindConfig<Product> = {
      select: [
        'id',
        'title',
        'thumbnail',
        'type_id',
        'type_lv1_id',
        'type_lv2_id',
        'created_at',
        'status',
        'display_id',
        'display_code',
        'is_soldout',
        'is_maker_ship',
      ],
      order: {
        created_at: 'DESC',
      },
      relations: ['variants', 'store', 'type', 'type_lv1', 'type_lv2'],
    }
    data.limit ? (config.take = data.limit) : ''

    data.offset ? (config.skip = data.offset) : ''

    const query = buildQuery(selector, config)

    data.display_code
      ? (query.where.display_code = ILike(`%${data.display_code}%`))
      : ''

    if (data.url || data.ids) {
      let idss = []
      let count = 0

      let ids1 = []
      if (data.url) {
        ids1 = await this.getProductWithUrl(data.url)
        count++
      }

      let ids2 = []
      if (data?.ids?.length > 0) {
        ids2 = data.ids
        count++
      }

      idss = [].concat(ids1, ids2)
      const arr = _.countBy(idss)
      const listIds = []

      for (const key in arr) {
        const element = arr[key]
        if (element === count) {
          listIds.push(key)
        }
      }

      query.where.id = In(listIds)
    }

    data.display_id ? (query.where.display_id = data.display_id) : ''

    data.title ? (query.where.title = ILike(`%${data.title}%`)) : ''

    if (data.is_stock) {
      const arr = []
      for (const i of data.is_stock) {
        i === 'in_stock' ? arr.push(false) : ''
        i === 'out_stock' ? arr.push(true) : ''
        i === 'under_limit' ? arr.push(true) : ''
      }
      query.where.is_soldout = In(arr)
    }

    const released = await this.checkFromTo(
      data.released_from,
      data.released_to,
    )

    released === 'dual'
      ? (query.where.updated_at = Between(data.released_from, data.released_to))
      : ''

    released !== 'none' ? (query.where.status = ProductStatus.PUBLISHED) : ''

    released === 'from'
      ? (query.where.updated_at = MoreThanOrEqual(data.released_from))
      : ''

    released === 'to'
      ? (query.where.updated_at = LessThanOrEqual(data.released_to))
      : ''

    if (data.is_maker_ship) {
      const arr = []
      for (const i of data.is_maker_ship) {
        i === 'shipped' ? arr.push(true) : ''
        i === 'not_shipped' ? arr.push(false) : ''
      }
      query.where.is_maker_ship = In(arr)
    }

    const created = await this.checkFromTo(data.created_from, data.created_to)

    created === 'dual'
      ? (query.where.created_at = Between(data.created_from, data.created_to))
      : ''

    created === 'from'
      ? (query.where.created_at = MoreThanOrEqual(data.created_from))
      : ''

    created === 'to'
      ? (query.where.created_at = LessThanOrEqual(data.created_to))
      : ''

    const updated = await this.checkFromTo(data.updated_from, data.updated_to)

    updated === 'dual'
      ? (query.where.updated_at = Between(data.updated_from, data.updated_to))
      : ''

    updated === 'from'
      ? (query.where.updated_at = MoreThanOrEqual(data.updated_from))
      : ''

    updated === 'to'
      ? (query.where.updated_at = LessThanOrEqual(data.updated_to))
      : ''

    if (
      data.store_display_id !== undefined ||
      data.store_name ||
      data.store_plan_type ||
      data.email
    ) {
      const ob = Object()

      data.store_display_id ? (ob.display_id = data.store_display_id) : ''

      data.store_plan_type ? (ob.plan_type = In(data.store_plan_type)) : ''

      data.store_name ? (ob.name = ILike(`%${data.store_name}%`)) : ''

      if (data.email) {
        const storeIds = await this.getStoreWithEmail(data.email)

        ob.id = In(storeIds)
      }
      query.where.store = ob
    }

    data.type_id ? (query.where.type_id = data.type_id) : ''

    data.type_lv1_id ? (query.where.type_lv1_id = data.type_lv1_id) : ''

    data.type_lv2_id ? (query.where.type_lv2_id = data.type_lv2_id) : ''

    if (data.status) {
      query.where.status = data.status as unknown as ProductStatus
    } else {
      query.where.status = Not(In(notAllowedGetMyProductStatuses))
    }

    const [products, count] = await proRepo.findAndCount(query)

    products.map(async (e: Product) => {
      e = await this.standardizedVariants(e)
      return e
    })

    for (let i = 0; i < products.length; i++) {
      let stock_quantity = 0

      if (products[i].variants) {
        products[i].variants.forEach((item) => {
          stock_quantity += item.inventory_quantity
        })
      }
      products[i].stock_quantity = stock_quantity
    }

    return [products, count]
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

  async getProductWithUrl(url: string): Promise<string[]> {
    return this.atomicPhase_(async (transactionManager) => {
      const config = loadConfig()

      const productRepo = transactionManager.getCustomRepository(
        this.productRepository_,
      )

      const qb = productRepo.createQueryBuilder('prod')
      qb.select('prod.id').where(
        `concat('${config.frontendUrl.base}', '/product/', id) LIKE '%${url}%'`,
      )
      const result = await qb.getMany()
      return [...new Set(result.map((r) => r.id).filter((v) => !!v))]
    })
  }

  async standardizedVariants(product: Product) {
    if (product.variants?.length) {
      product.variants = product.variants.filter(
        (v: ProductVariant) => !v.is_deleted,
      )
    }
    return product
  }

  async getStoreWithEmail(email: string): Promise<string[]> {
    return this.atomicPhase_(async (transactionManager) => {
      const userRepo = transactionManager.getCustomRepository(
        this.userRepository_,
      )
      const query = buildQuery(
        { email: ILike(`%${email}%`) },
        { select: ['store_id'] },
      )

      const result = await userRepo.find(query)
      return [...new Set(result.map((r) => r.store_id).filter((v) => !!v))]
    })
  }
}
