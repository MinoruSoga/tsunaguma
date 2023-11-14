/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Order, TransactionBaseService } from '@medusajs/medusa'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment'
import { OrderService as MedusaOrderService } from '@medusajs/medusa/dist/services'
import {
  ExtendedFindConfig,
  FindConfig,
  Selector,
} from '@medusajs/medusa/dist/types/common'
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
} from 'typeorm'

import { LineItem } from '../../../modules/cart/entity/line-item.entity'
import { TotalsService } from '../../cart/services/totals.service'
import { Discount } from '../../discount/entities/discount.entity'
import { DiscountRepository } from '../../discount/repository/discount.repository'
import { OrderDiscountsRepository } from '../../discount/repository/order-discounts.repository'
import { UserType } from '../../user/entity/user.entity'
import UserService from '../../user/services/user.service'
import { UserSearchService } from '../../user/services/user-search.service'
import UserRepository from '../../user/user.repository'
import { GetListOrderCmsBody } from '../controllers/get-list-order.cms.admin.controller'
import { Order as NewOrder } from '../entity/order.entity'
import { OrderRepository } from '../repository/order.repository'

export const orderRelationships = [
  'store',
  'items',
  'region',
  'customer',
  'items.line_item_addons',
  'items.line_item_addons.lv1',
  'items.line_item_addons.lv2',
  'payments',
]

type InjectedDependencies = {
  manager: EntityManager
  orderRepository: typeof OrderRepository
  userRepository: typeof UserRepository
  userSearchService: UserSearchService
  lineItemRepository: typeof LineItemRepository
  paymentRepository: typeof PaymentRepository
  discountRepository: typeof DiscountRepository
  orderDiscountsRepository: typeof OrderDiscountsRepository
}

@Service()
export class OrderSearchService extends TransactionBaseService {
  static resolutionKey = 'orderSearchService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  private readonly userService: UserService
  private readonly userRepository: typeof UserRepository
  protected totalsService: TotalsService
  private readonly orderRepository: typeof OrderRepository
  private readonly lineItemRepository: typeof LineItemRepository
  private readonly paymentRepo: typeof PaymentRepository
  protected readonly discountRepo_: typeof DiscountRepository
  protected readonly orderDiscountsRepo: typeof OrderDiscountsRepository

  protected readonly userSearchService: UserSearchService

  static Events = {
    ...MedusaOrderService.Events,
    PARTIAL_SETTLED: 'order.partial_settled',
    SETTLED: 'order.settled',
    SETTLED_SHOP: 'order.settled_shop',
    REQUEST_CANCEL: 'order.request_cancel',
    CANCEL_COMPLETE: 'order.cancel_complete',
    SHIPMENT_COMPLETE: 'order.shipment_complete', // review order complete
    ORDER_RETURN_REQUESTED: 'order.return_request_created',
  }

  constructor(container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.userRepository = container.userRepository
    this.orderRepository = container.orderRepository
    this.lineItemRepository = container.lineItemRepository
    this.userSearchService = container.userSearchService
    this.paymentRepo = container.paymentRepository
    this.discountRepo_ = container.discountRepository
    this.orderDiscountsRepo = container.orderDiscountsRepository
  }

  async searchOrderCms(data: GetListOrderCmsBody): Promise<[Order[], number]> {
    const orderRepo = this.manager_.getCustomRepository(this.orderRepository)
    const config: FindConfig<NewOrder> = {
      relations: [
        'store',
        'customer',
        'billing_address',
        'shipping_address',
        'shipping_address.prefecture',
        'store.store_detail',
        'items',
        'region',
        'discounts',
        'discounts.rule',
        'items.line_item_addons',
        'items.tax_lines',
        'items.adjustments',
        'items.line_item_addons.lv1',
        'items.line_item_addons.lv2',
        'payments',
        'swaps',
        'claims',
        'gift_cards',
        'gift_card_transactions',
        'refunds',
        'shipping_methods',
        'shipping_methods.tax_lines',
      ],
      order: {
        created_at: 'DESC',
      },
    }
    data.limit ? (config.take = data.limit) : ''

    data.offset ? (config.skip = data.offset) : ''
    const query = buildQuery({}, config) as ExtendedFindConfig<Order>

    const selector = []

    let ids1: string[],
      ids2: string[],
      ids3: string[],
      ids4: string[],
      count = 0

    if (!_.isNil(data.amount_from) || !_.isNil(data.amount_to)) {
      ids1 = await this.getListOrderIdsWithAmountRange(data)
      count++
    }
    if (data.product_code || data.product_id || data.product_name) {
      ids2 = await this.getListOrderWithProductSearch(data)
      count++
    }

    if (data.payment_method?.length > 0) {
      ids3 = await this.getOrderWithPayment(data.payment_method)
      count++
    }

    if (data.coupon_id || data.promo_code) {
      ids4 = await this.getOrderWithDiscount(data.coupon_id, data.promo_code)
      count++
    }
    const ids = [].concat(ids1, ids2, ids3, ids4)
    const idss = _.countBy(ids)

    const orderIds = []
    for (const key in idss) {
      if (idss[key] === count) {
        orderIds.push(key)
      }
    }

    const selectorNotIncludeStatus = {
      ...(data.product_code ||
      data.product_id ||
      data.product_name ||
      !_.isNil(data.amount_from) ||
      !_.isNil(data.amount_to) ||
      data.payment_method?.length > 0 ||
      data.coupon_id ||
      data.promo_code
        ? {
            id: In(orderIds),
          }
        : {}),
      ...(data.created_to || data.created_from
        ? {
            created_at:
              data.created_to && data.created_from
                ? Between(data.created_from, data.created_to)
                : data.created_from
                ? MoreThanOrEqual(data.created_from)
                : LessThanOrEqual(data.created_to),
          }
        : {}),
      ...(data.updated_to || data.updated_from
        ? {
            updated_at:
              data.updated_to && data.updated_from
                ? Between(data.updated_from, data.updated_to)
                : data.updated_from
                ? MoreThanOrEqual(data.updated_from)
                : LessThanOrEqual(data.updated_to),
          }
        : {}),
      ...(data.shipped_to || data.shipped_from
        ? {
            shipped_at:
              data.shipped_to && data.shipped_from
                ? Between(data.shipped_from, data.shipped_to)
                : data.shipped_from
                ? MoreThanOrEqual(data.shipped_from)
                : LessThanOrEqual(data.shipped_to),
          }
        : {}),
      ...(data.canceled_to || data.canceled_from
        ? {
            canceled_at:
              data.canceled_to && data.canceled_from
                ? Between(data.canceled_from, data.canceled_to)
                : data.canceled_from
                ? MoreThanOrEqual(data.canceled_from)
                : LessThanOrEqual(data.canceled_to),
          }
        : {}),
      ...(data.completed_to || data.completed_from
        ? {
            updated_at:
              data.completed_to && data.completed_from
                ? Between(data.completed_from, data.completed_to)
                : data.completed_from
                ? MoreThanOrEqual(data.completed_from)
                : LessThanOrEqual(data.completed_to),
            status: 'completed',
          }
        : {}),
      ...(data.display_id_from || data.display_id_to
        ? {
            display_id:
              data.display_id_from && data.display_id_to
                ? Between(data.display_id_from, data.display_id_to)
                : data.display_id_from
                ? MoreThanOrEqual(data.display_id_from)
                : LessThanOrEqual(data.display_id_to),
          }
        : {}),

      ...(data.store_name
        ? {
            store: {
              name: ILike(`%${data.store_name}%`),
            },
          }
        : {}),
      ...(data.store_id
        ? {
            store: {
              display_id: data.store_id,
            },
          }
        : {}),
      ...(data.customer_id
        ? {
            customer: {
              display_id: data.customer_id,
            },
          }
        : {}),
      ...(data.email
        ? {
            email: ILike(`%${data.email}%`),
          }
        : {}),
      ...(data.phone
        ? {
            billing_address: {
              phone: data.phone,
            },
          }
        : {}),
      ...(data.display_id
        ? {
            display_id: data.display_id,
          }
        : {}),
      ...(data.shipping_address
        ? {
            shipping_address: {
              prefecture: {
                id: data.shipping_address,
              },
            },
          }
        : {}),
      ...(data.plan_type?.length || data.ship_from
        ? {
            store: {
              ...(data.plan_type?.length
                ? { plan_type: In(data.plan_type) }
                : {}),

              ...(data.ship_from
                ? {
                    store_detail: {
                      prefecture_id: data.ship_from,
                    },
                  }
                : {}),
            },
          }
        : {}),
      ...(data?.customer_name ||
      data?.customer_name_furi ||
      data?.customer_type?.length ||
      data.nickname
        ? { customer_id: In(await this.getListCustomerIds(data)) }
        : {}),
    }

    if (data.status?.length) {
      data.status.forEach((status) => {
        selector.push({
          ...this.getStatusSelector(status),
          ...selectorNotIncludeStatus,
        })
      })
    } else selector.push(selectorNotIncludeStatus)

    query.where = selector
    return await orderRepo.findAndCount(query)
  }

  async getListCustomerIds(data: GetListOrderCmsBody) {
    let count = 0
    let ids1 = []
    if (data.customer_name || data.customer_name_furi) {
      ids1 = await this.userSearchService.getUser(
        data.customer_name,
        data.customer_name_furi,
        undefined,
        undefined,
        undefined,
      )

      count++
    }

    let ids2 = []
    if (data.customer_type?.length) {
      const userRepo = this.manager_.getCustomRepository(this.userRepository)
      const qb = userRepo.createQueryBuilder('user')

      const types = data.customer_type?.reduce((prev, current) => {
        if (current === 'is_not_store') {
          return [
            ...prev,
            UserType.ADMIN_ADMIN,
            UserType.ADMIN_STAFF,
            UserType.CUSTOMER,
          ]
        }
        if (current === 'is_store') {
          return [...prev, UserType.STORE_PRIME, UserType.STORE_STANDARD]
        }
        return [...prev, current]
      }, [])

      qb.where(`type IN (${types.map((t) => "'" + t + "'").join(',')})`)
      const rl = await qb.getMany()
      ids2 = rl.map((i) => i.id)
      count++
    }

    let ids3 = []
    if (data.nickname) {
      const userRepo = this.manager_.getCustomRepository(this.userRepository)
      const qr = buildQuery(
        { nickname: ILike(`%${data.nickname}%`) },
        { order: { created_at: 'DESC' } },
      )
      const users = await userRepo.find(qr)
      ids3 = users.map((i) => i.id)
      count++
    }

    const ids = [].concat(ids1, ids2, ids3)
    const idss = _.countBy(ids)

    const listIds = []
    for (const key in idss) {
      if (idss[key] === count) {
        listIds.push(key)
      }
    }
    return listIds
  }

  protected getStatusSelector = (status) => {
    switch (status) {
      case 'new_order':
        return {
          status: 'pending',
          payment_status: In(['not_paid', 'awaiting', 'captured']),
          fulfillment_status: 'not_fulfilled',
        }

      case 'preparing_to_ship':
        return {
          status: 'pending',
          fulfillment_status: 'fulfilled',
        }
      case 'shipping_completed':
        return {
          status: 'pending',
          fulfillment_status: 'shipped',
        }

      case 'transaction_completed':
        return {
          status: 'completed',
        }

      case 'cancel':
        return {
          status: 'canceled',
        }
    }
  }

  getListOrderWithProductSearch = async (data: GetListOrderCmsBody) => {
    const lineItemRepo = this.manager_.getCustomRepository(
      this.lineItemRepository,
    )

    const query = buildQuery(
      {
        variant: {
          product: {
            ...(data.product_id
              ? {
                  display_id: data.product_id,
                }
              : {}),
            ...(data.product_code
              ? {
                  display_code: ILike(`%${data.product_code}%`),
                }
              : {}),
            ...(data.product_name
              ? {
                  title: ILike(`%${data.product_name}%`),
                }
              : {}),
          },
        },
      },
      {
        relations: ['variant', 'variant.product'],
      },
    )

    const lineItems = await lineItemRepo.find(query)

    return [
      ...new Set(
        lineItems.map((li: LineItem) => li.order_id).filter((i) => !_.isNil(i)),
      ),
    ]
  }

  getListOrderIdsWithAmountRange = async (data: GetListOrderCmsBody) => {
    const orderRepo = this.manager_.getCustomRepository(this.orderRepository)

    const qb = orderRepo.createQueryBuilder('order')

    let totalCond = ''
    if (!_.isNil(data.amount_from) || !_.isNil(data.amount_to)) {
      if (!_.isNil(data.amount_from) && !_.isNil(data.amount_to)) {
        totalCond = `cast(metadata#>>'{price, total}' as integer) between ${data.amount_from} and ${data.amount_to} `
      } else if (!_.isNil(data.amount_from)) {
        totalCond = `cast(metadata#>>'{price, total}' as integer)  >  ${data.amount_from} `
      } else if (!_.isNil(data.amount_to)) {
        totalCond = `cast(metadata#>>'{price, total}' as integer) <  ${data.amount_to} `
      }
    }

    if (totalCond) {
      qb.where(totalCond)
    }

    const orders = await qb.getMany()
    return orders.map((o) => o.id)
  }

  async getOrderWithPayment(data: string[]) {
    const paymentRepo = this.manager_.getCustomRepository(this.paymentRepo)

    const query = buildQuery(
      { provider_id: In(data) },
      { order: { created_at: 'DESC' } },
    )

    const payment = await paymentRepo.find(query)

    if (payment?.length < 1) {
      return []
    }
    return payment.map((e) => e.order_id)
  }

  async getOrderWithDiscount(coupon_id?: number, promo_code?: string) {
    return this.atomicPhase_(async (tx) => {
      const discountRepo = tx.getCustomRepository(this.discountRepo_)
      const orderDiscountsRepo = tx.getCustomRepository(this.orderDiscountsRepo)

      const sel: Selector<Discount> = {}
      const conf: FindConfig<Discount> = { order: { created_at: 'DESC' } }

      const qrr = buildQuery(sel, conf)

      if (coupon_id && !(coupon_id && promo_code)) {
        qrr.where.display_id = coupon_id
      }

      if (promo_code && !(coupon_id && promo_code)) {
        qrr.where.code = promo_code
      }

      if (coupon_id && promo_code) {
        qrr.where = [{ display_id: coupon_id }, { code: promo_code }]
      }

      const discounts = await discountRepo.find(qrr)

      if (discounts?.length < 1) {
        return []
      }

      const ids = discounts.map((e) => e.id)

      const selector: Selector<Discount> = {}
      const config: FindConfig<Discount> = {}

      const query = buildQuery(selector, config)

      query.where = [{ id: In(ids) }, { parent_discount_id: In(ids) }]

      const data = await discountRepo.find(query)

      if (data?.length < 1) {
        return []
      }

      const dIds = data.map((e) => e.id)
      const orders = await orderDiscountsRepo.find({ discount_id: In(dIds) })

      if (orders?.length < 1) {
        return []
      }

      return orders.map((e) => e.order_id)
    })
  }
}
