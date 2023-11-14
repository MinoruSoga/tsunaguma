/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ClaimOrder,
  defaultStoreOrdersFields,
  defaultStoreOrdersRelations,
  Fulfillment,
  FulfillmentStatus,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  Return,
  Swap,
} from '@medusajs/medusa'
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment'
import { ProductOptionValueRepository } from '@medusajs/medusa/dist/repositories/product-option-value'
import { OrderService as MedusaOrderService } from '@medusajs/medusa/dist/services'
import {
  ExtendedFindConfig,
  FindConfig,
  Selector,
} from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import {
  Between,
  DeepPartial,
  EntityManager,
  FindManyOptions,
  ILike,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Not,
} from 'typeorm'

import loadConfig from '../../../helpers/config'
import {
  MARGIN_RATE_PRM,
  MARGIN_RATE_STD,
  ORDER_COMPLETE_DURATION,
} from '../../../helpers/constant'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import { OrderStatusEnum } from '../../cart/controllers/get-items-store.admin.controller'
import { Cart } from '../../cart/entity/cart.entity'
import { TotalsService } from '../../cart/services/totals.service'
import { DiscountRepository } from '../../discount/repository/discount.repository'
import { OrderDiscountsRepository } from '../../discount/repository/order-discounts.repository'
import { UserDiscountRepository } from '../../discount/repository/user-discount.repository'
import { PriceOrderMetadata } from '../../discount/services/discount.service'
import { PrefectureService } from '../../prefecture/services/prefecture.service'
import { Store, StorePlanType } from '../../store/entity/store.entity'
import { StoreBillingRepository } from '../../store/repository/store-billing.repository'
import StoreService from '../../store/services/store.service'
import { Customer } from '../../user/entity/customer.entity'
import { User } from '../../user/entity/user.entity'
import UserService from '../../user/services/user.service'
import UserRepository from '../../user/user.repository'
import { RequestCancelParams } from '../controllers/open-cancel-request.admin.controller'
import { UpdateOrderCmsParams } from '../controllers/update-order.cms.admin.controller'
import { Order as NewOrder, OrderCancelStatus } from '../entity/order.entity'
import { OrderRepository } from '../repository/order.repository'
import { convertToDateTime } from './../../../helpers/time'
import { LineItem } from './../../cart/entity/line-item.entity'
import {
  Discount,
  DiscountType,
} from './../../discount/entities/discount.entity'

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

export enum OrderDisplayStatusEnum {
  NEW_ORDER = 'new_order',
  PREPARING_TO_SHIP = 'preparing_to_ship',
  SHIPPING_COMPLETED = 'shipping_completed',
  TRANSACTION_COMPLETED = 'transaction_completed',
  CANCEL = 'cancel',
  CANCEL_REQUEST = 'cancel_request',
  RETURNS = 'returns',
}

type InjectedDependencies = {
  manager: EntityManager
  orderRepository: typeof OrderRepository
  userRepository: typeof UserRepository
  productOptionValueRepository: typeof ProductOptionValueRepository
  paymentRepository: typeof PaymentRepository
  customerService: any
  paymentProviderService: any
  shippingOptionService: any
  shippingProfileService: any
  discountService: any
  fulfillmentProviderService: any
  fulfillmentService: any
  lineItemService: any
  totalsService: TotalsService
  regionService: any
  cartService: any
  addressRepository: any
  giftCardService: any
  draftOrderService: any
  inventoryService: any
  eventBusService: any
  featureFlagRouter: any
  loggedInUser?: User
  orderService: OrderService
  userService: UserService
  storeService: StoreService
  prefectureService: PrefectureService
  logger: Logger
  storeBillingRepository: typeof StoreBillingRepository
  orderDiscountsRepository: typeof OrderDiscountsRepository
  discountRepository: typeof DiscountRepository
  userDiscountRepository: typeof UserDiscountRepository
}

@Service({ scope: 'SCOPED', override: MedusaOrderService })
export class OrderService
  extends MedusaOrderService
  implements IEmailTemplateDataService
{
  private readonly manager: EntityManager
  private readonly container: InjectedDependencies
  private readonly productOptionValueRepo: typeof ProductOptionValueRepository
  private readonly paymentRepository: typeof PaymentRepository
  private readonly prefectureService: PrefectureService
  private readonly storeService: StoreService
  private readonly userService: UserService
  private readonly logger: Logger
  private readonly storeBillingRepository: typeof StoreBillingRepository
  private readonly userRepository: typeof UserRepository
  private readonly orderDiscountsRepo: typeof OrderDiscountsRepository
  private readonly discountRepo: typeof DiscountRepository
  private readonly userDiscountRepo: typeof UserDiscountRepository
  protected totalsService: TotalsService

  static Events = {
    ...MedusaOrderService.Events,
    PARTIAL_SETTLED: 'order.partial_settled',
    SETTLED: 'order.settled',
    SETTLED_SHOP: 'order.settled_shop',
    REQUEST_CANCEL: 'order.request_cancel',
    CANCEL_COMPLETE: 'order.cancel_complete',
    CANCEL_COMPLETE_SHOP: 'order.cancel_complete_shop',
    SHIPMENT_COMPLETE: 'order.shipment_complete', // review order complete
    ORDER_RETURN_REQUESTED: 'order.return_request_created',
  }

  constructor(container: InjectedDependencies) {
    super(container)

    this.prefectureService = container.prefectureService
    this.manager = container.manager
    this.totalsService = container.totalsService
    this.container = container
    this.productOptionValueRepo = container.productOptionValueRepository
    this.paymentRepository = container.paymentRepository
    this.logger = container.logger
    this.storeService = container.storeService
    this.storeBillingRepository = container.storeBillingRepository
    this.userService = container.userService
    this.userRepository = container.userRepository
    this.orderDiscountsRepo = container.orderDiscountsRepository
    this.discountRepo = container.discountRepository
    this.userDiscountRepo = container.userDiscountRepository
  }

  async genEmailData(
    event: string,
    data: OrderNotificationData,
  ): Promise<EmailTemplateData> {
    return {
      to: data.email,
      format: data.format,
      data: data.data,
      customer_id: data.customer_id ?? null,
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): OrderService {
    if (!transactionManager) {
      return this
    }

    const cloned = new OrderService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async paymentHistory(orderId: string, config: FindConfig<Order>) {
    const paymentRepo = this.manager_.getCustomRepository(
      this.paymentRepository,
    )
    const query = buildQuery({ order_id: orderId }, config)
    return await paymentRepo.findAndCount(query as FindManyOptions<Payment>)
  }

  async listOrderCms(
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ): Promise<[Order[], number]> {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const query = buildQuery(selector, config)

    const DisplayStatus = selector['status']

    delete selector['status']

    switch (DisplayStatus) {
      case OrderDisplayStatusEnum.NEW_ORDER as unknown as OrderStatus:
        query.where = [
          {
            status: 'pending',
            payment_status: In(['not_paid', 'awaiting', 'captured']),
            fulfillment_status: 'not_fulfilled',
          },
        ]
        break
      case OrderDisplayStatusEnum.PREPARING_TO_SHIP as unknown as OrderStatus:
        query.where = [
          {
            status: 'pending',
            fulfillment_status: 'fulfilled',
          },
        ]
        break
      case OrderDisplayStatusEnum.SHIPPING_COMPLETED as unknown as OrderStatus:
        query.where = [
          {
            status: 'pending',
            fulfillment_status: 'shipped',
          },
        ]
        break
      case OrderDisplayStatusEnum.TRANSACTION_COMPLETED as unknown as OrderStatus:
        query.where = [
          {
            status: 'completed',
          },
        ]
        break
      case OrderDisplayStatusEnum.CANCEL as unknown as OrderStatus:
        query.where = [
          {
            status: 'canceled',
          },
        ]
        break
      default:
        break
    }

    const [raw, count] = await oderRepo.findAndCount(query)

    await Promise.all(
      raw.map(async (i: NewOrder) => {
        return await this.decorateOptions(i)
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ).catch(function (err) {
      return
    })

    return [raw, count]
  }

  async decorateOptions(order: NewOrder): Promise<Order> {
    const productOptionValueRepo = this.manager.getCustomRepository(
      this.productOptionValueRepo,
    )

    if (order.items && order.store_id) {
      order.items = await Promise.all(
        order.items.map(async (item: LineItem) => {
          const options = await productOptionValueRepo.find({
            where: { variant_id: item.variant_id },
          })
          if (options !== null) {
            item.variant.options = options
          }
          return item
        }),
      )
    }

    return order
  }

  async listOrdersStore(
    storeId: string,
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ): Promise<[Order[], number]> {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const search = selector['search']

    delete selector['search']

    const query = buildQuery(
      { ...selector, store_id: storeId, parent_id: Not(IsNull()) },
      config,
    )
    const { select, relations } = this.transformQueryForTotals(config)
    query.select = select
    delete query.relations
    query.relations = ['customer']

    if (search) {
      query.where = [{ customer: { nickname: ILike(`%${search}%`) } }]
    }

    switch (selector['status']) {
      case OrderDisplayStatusEnum.NEW_ORDER as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              payment_status: In(['not_paid', 'awaiting', 'captured']),
              fulfillment_status: 'not_fulfilled',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              payment_status: In(['not_paid', 'awaiting', 'captured']),
              fulfillment_status: 'not_fulfilled',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.PREPARING_TO_SHIP as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'fulfilled',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'fulfilled',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.SHIPPING_COMPLETED as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'shipped',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'shipped',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.TRANSACTION_COMPLETED as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'completed',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'completed',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.CANCEL as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'canceled',
              // @ts-ignore
              cancel_status: OrderCancelStatus.CANCEL,
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'canceled',
              // @ts-ignore
              cancel_status: OrderCancelStatus.CANCEL,
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.CANCEL_REQUEST as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'canceled',
              // @ts-ignore
              cancel_status: OrderCancelStatus.PENDING,
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'canceled',
              // @ts-ignore
              cancel_status: OrderCancelStatus.PENDING,
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      default:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
    }

    if (selector['year'] && selector['month']) {
      const { from, to } = this.getMonth(selector['year'], selector['month'])
      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          created_at: Between(from, to),
          fulfillment_status: 'shipped',
          status: 'completed',
        },
      ]
    }
    relations.push('billing_address')
    const raw = await oderRepo.findWithRelations(relations, query)

    const count = await oderRepo.count(query)

    let rl = []

    for (const r of raw) {
      // @ts-ignore
      r.items = await Promise.all(
        r.items.map(async (item: LineItem) => {
          const itemsTotal = await this.totalsService.getLineItemTotals(
            item,
            r as any,
          )
          return Object.assign(item, itemsTotal)
        }),
      )

      rl.push(r)
    }

    rl = await Promise.all(
      rl.map(async (i: NewOrder) => {
        return await this.decorateVariantOptions(i)
      }),
    )
    const orders = await Promise.all(
      rl.map(async (i) => await this.convertOrders(i)),
    )
    return [orders, count]
  }

  async convertOrders(order: NewOrder): Promise<NewOrder> {
    const optionRepo = this.manager.getCustomRepository(
      this.productOptionValueRepo,
    )
    let result = {} as NewOrder

    const defaultFields = [
      'id',
      'display_id',
      'status',
      'fulfillment_status',
      'payment_status',
      'cancel_status',
      'created_at',
      'metadata',
      'shipped_at',
    ]

    result = Object.assign(result, _.pick(order, defaultFields))

    result.store = _.pick(order.store, [
      'id',
      'name',
      'plan_type',
      'url',
      'is_url_updated',
      'avatar',
    ]) as Store

    result.items = await Promise.all(
      order.items.map(async (i) => {
        const options = await optionRepo.find({ variant_id: i.variant_id })
        return {
          ..._.pick(i, [
            'id',
            'total_unit_price',
            'title',
            'quantity',
            'thumbnail',
          ]),
          variant: {
            ..._.pick(i.variant, ['id', 'title', 'product_id']),
            product: _.pick(i.variant.product, [
              'id',
              'title',
              'thumbnail',
              'status',
            ]),
            options,
          },
          line_item_addons: (i as LineItem).line_item_addons,
        } as LineItem
      }),
    )

    result.customer = _.pick(order.customer, ['id', 'nickname']) as Customer

    return result
  }

  public async totalOrdersStore(
    storeId: string,
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ) {
    const store = await this.storeService.getStoreById(
      { id: storeId },
      {
        select: [
          'plan_type',
          'margin_rate',
          'spec_rate',
          'spec_starts_at',
          'spec_ends_at',
        ],
      },
    )
    let margin_rate = MARGIN_RATE_STD
    let spec_rate
    let spec_starts_at
    let spec_ends_at

    if (store.plan_type === StorePlanType.PRIME) {
      margin_rate = MARGIN_RATE_PRM
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    } else {
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    }

    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    delete config.skip
    delete config.take
    const query = buildQuery(
      { ...selector, store_id: storeId, parent_id: Not(IsNull()) },
      { ...config, select: ['id', 'metadata'] },
    )
    if (selector['year'] && selector['month']) {
      const { from, to } = this.getDateInMonth(
        selector['year'],
        selector['month'],
      )

      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          shipped_at: Between(from, to),
          fulfillment_status: 'shipped',
          status: 'completed',
        },
      ]
    }

    const orders = await oderRepo.find(query)

    const result = {
      total: 0,
      subtotal: 0,
      fee_total: 0,
      shipping_total: 0,
      discount_total: 0,
      tax_total: 0,
    }
    for (const order of orders) {
      let price: PriceOrderMetadata = order.metadata.price
      if (!price) {
        const raw = await this.retrieveDetail(order.id, {
          select: defaultStoreOrdersFields,
          relations: defaultStoreOrdersRelations.concat([
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
            'items.shipping_method',
            'discounts.parent_discount',
          ]),
        })
        price = await this.capturePrice(raw as NewOrder)
      }

      if (spec_ends_at && spec_starts_at) {
        if (
          order.created_at > spec_starts_at &&
          order.created_at < spec_ends_at
        ) {
          result.total = result.total + (price?.subtotal || 0)

          result.fee_total =
            result.fee_total + (price?.subtotal || 0) * (spec_rate / 100)

          result.shipping_total =
            result.shipping_total + (price?.shipping_total || 0)

          result.discount_total =
            result.discount_total + (price?.discount_total || 0)
        } else {
          result.total = result.total + (price?.subtotal || 0)

          result.shipping_total =
            result.shipping_total + (price?.shipping_total || 0)

          result.discount_total =
            result.discount_total + (price?.discount_total || 0)

          result.fee_total =
            result.fee_total + (price?.subtotal || 0) * (margin_rate / 100)
        }
      } else {
        result.total = result.total + (price?.subtotal || 0)

        result.shipping_total =
          result.shipping_total + (price?.shipping_total || 0)

        result.discount_total =
          result.discount_total + (price?.discount_total || 0)

        result.fee_total =
          result.fee_total + (price?.subtotal || 0) * (margin_rate / 100)
      }
    }

    if (store.plan_type === StorePlanType.PRIME) {
      result.subtotal = result.total - Math.round(result.fee_total)
    } else {
      result.subtotal =
        result.total + result.shipping_total - Math.round(result.fee_total)
    }

    return {
      total: Math.round(result.total) || 0,
      shipping_total: Math.round(result.shipping_total) || 0,
      discount_total: Math.round(result.discount_total) || 0,
      tax_total: Math.round(result.tax_total) || 0,
      subtotal: Math.round(result.subtotal) || 0,
      fee_total: Math.round(result.fee_total) || 0,
    }
  }

  public async getBillingStore(storeId: string) {
    const storeBillRepo = this.manager_.getCustomRepository(
      this.storeBillingRepository,
    )

    const lastMonth = await storeBillRepo
      .createQueryBuilder('store_billing')
      .where({ store_id: storeId })
      .select(["to_char(created_at, 'MM') as month", 'id'])
      .orderBy('created_at', 'DESC')
      .getRawOne()

    const lastYear = await storeBillRepo
      .createQueryBuilder('store_billing')
      .where({ store_id: storeId })
      .select(["to_char(created_at, 'YYYY') as year", 'id'])
      .orderBy('created_at', 'DESC')
      .getRawOne()

    return this.totalBillingStore(storeId, lastMonth?.month, lastYear?.year)
  }

  public async totalBillingStore(
    storeId: string,
    month?: string,
    year?: string,
  ) {
    const store = await this.storeService.getStoreById(
      { id: storeId },
      {
        select: [
          'plan_type',
          'margin_rate',
          'spec_rate',
          'spec_starts_at',
          'spec_ends_at',
        ],
      },
    )
    let margin_rate = 5
    let spec_rate
    let spec_starts_at
    let spec_ends_at

    if (store.plan_type === StorePlanType.PRIME) {
      margin_rate = 18
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    } else {
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    }

    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    const query = buildQuery(
      { store_id: storeId, parent_id: Not(IsNull()) },
      {
        select: ['id', 'metadata', 'created_at'],
      },
    )

    if (year !== undefined && month !== undefined) {
      const { from, to } = this.getRangeTime(year, month)

      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          shipped_at: Between(from, to),
          fulfillment_status: 'shipped',
          status: 'completed',
        },
      ]
    } else {
      const toDate = new Date()

      const toMonth = toDate.getMonth()

      const toYear = toDate.getFullYear()

      const to = this.getTo(toYear.toString(), toMonth.toString())

      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          fulfillment_status: 'shipped',
          shipped_at: LessThanOrEqual(to),
          status: 'completed',
        },
      ]
    }

    const orders = await oderRepo.find(query)

    const result = {
      total: 0,
      subtotal: 0,
      fee_total: 0,
      shipping_total: 0,
      discount_total: 0,
      tax_total: 0,
    }

    for (const order of orders) {
      let price: PriceOrderMetadata = order.metadata.price
      if (!price) {
        const raw = await this.retrieveDetail(order.id, {
          select: defaultStoreOrdersFields,
          relations: defaultStoreOrdersRelations.concat([
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
            'items.shipping_method',
            'discounts.parent_discount',
          ]),
        })
        price = await this.capturePrice(raw as NewOrder)
      }

      if (!price) {
        const raw = await this.retrieveDetail(order.id, {
          select: defaultStoreOrdersFields,
          relations: defaultStoreOrdersRelations.concat([
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
            'items.shipping_method',
            'discounts.parent_discount',
          ]),
        })
        price = await this.capturePrice(raw as NewOrder)
      }
      if (spec_ends_at && spec_starts_at) {
        if (
          order.created_at > spec_starts_at &&
          order.created_at < spec_ends_at
        ) {
          result.total = result.total + (price?.subtotal || 0)

          result.fee_total =
            result.fee_total + (price?.subtotal || 0) * (spec_rate / 100)

          result.shipping_total =
            result.shipping_total + (price?.shipping_total || 0)

          result.discount_total =
            result.discount_total + (price?.discount_total || 0)
        } else {
          result.total = result.total + (price?.subtotal || 0)

          result.shipping_total =
            result.shipping_total + (price?.shipping_total || 0)

          result.discount_total =
            result.discount_total + (price?.discount_total || 0)

          result.fee_total =
            result.fee_total + (price?.subtotal || 0) * (margin_rate / 100)
        }
      } else {
        result.total = result.total + (price?.subtotal || 0)

        result.shipping_total =
          result.shipping_total + (price?.shipping_total || 0)

        result.discount_total =
          result.discount_total + (price?.discount_total || 0)

        result.fee_total =
          result.fee_total + (price?.subtotal || 0) * (margin_rate / 100)
      }
    }

    if (store.plan_type === StorePlanType.PRIME) {
      result.subtotal = result.total - Math.round(result.fee_total)
    } else {
      result.subtotal =
        result.total + result.shipping_total - Math.round(result.fee_total)
    }

    return {
      total: Math.round(result.total) || 0,
      shipping_total: Math.round(result.shipping_total) || 0,
      discount_total: Math.round(result.discount_total) || 0,
      tax_total: Math.round(result.tax_total) || 0,
      subtotal: Math.round(result.subtotal) || 0,
      fee_total: Math.round(result.fee_total) || 0,
    }
  }

  public async ordersHistoryCustomer(
    customerId: string,
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    const query = buildQuery(
      { ...selector, customer_id: customerId, parent_id: Not(IsNull()) },
      config,
    )
    if (selector['year'] && selector['month']) {
      const { from, to } = this.getMonth(selector['year'], selector['month'])
      query.where = [
        {
          customer_id: customerId,
          parent_id: Not(IsNull()),
          created_at: Between(from, to),
        },
      ]
    }

    return await oderRepo.findAndCount(query)
  }

  async capturePrice(o: Cart | NewOrder): Promise<PriceOrderMetadata> {
    const metadata = (o.metadata || {}) as any
    metadata.price = metadata.price || {}

    metadata.price.total = o.total
    metadata.price.subtotal = o.items.reduce(
      (acc, item) => acc + item.subtotal,
      0,
    )
    metadata.price.shipping_total = await this.totalsService.getShippingTotal(o)
    metadata.price.discount_total = await this.totalsService.getDiscountTotal(o)

    await this.update(o.id, { discounts: o.discounts, metadata })
    return metadata.price as PriceOrderMetadata
  }

  async listOrdersStoreCms(
    storeId: string,
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const search = selector['search']

    delete selector['search']

    const query = buildQuery(
      { ...selector, store_id: storeId, parent_id: Not(IsNull()) },
      config,
    )

    if (search) {
      query.where = [{ customer: { nickname: ILike(`%${search}%`) } }]
    }
    switch (selector['status']) {
      case OrderDisplayStatusEnum.NEW_ORDER as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              payment_status: In(['not_paid', 'awaiting', 'captured']),
              fulfillment_status: 'not_fulfilled',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              payment_status: In(['not_paid', 'awaiting', 'captured']),
              fulfillment_status: 'not_fulfilled',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.PREPARING_TO_SHIP as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'fulfilled',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'fulfilled',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.SHIPPING_COMPLETED as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'shipped',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'pending',
              fulfillment_status: 'shipped',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.TRANSACTION_COMPLETED as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'completed',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'completed',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.CANCEL as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              status: 'canceled',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              status: 'canceled',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      case OrderDisplayStatusEnum.RETURNS as unknown as OrderStatus:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              // status: 'return',
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              // status: 'return',
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
      default:
        if (search) {
          query.where = [
            {
              store_id: storeId,
              customer: { nickname: ILike(`%${search}%`) },
              parent_id: Not(IsNull()),
            },
          ]
        } else {
          query.where = [
            {
              store_id: storeId,
              parent_id: Not(IsNull()),
            },
          ]
        }
        break
    }

    if (selector['year'] && selector['month']) {
      const { from, to } = this.getMonth(selector['year'], selector['month'])
      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          created_at: Between(from, to),
          fulfillment_status: 'shipped',
        },
      ]
    }

    const { select, relations } = this.transformQueryForTotals(config)
    query.select = select
    delete query.relations
    const raw = await oderRepo.findWithRelations(relations, query)
    const count = await oderRepo.count(query)

    return [raw, count]
  }

  protected getMonth(year: string, month: string) {
    const monthFilter = new Date(parseInt(year), parseInt(month) - 1)
    const from = monthFilter.toLocaleDateString()
    let to = ''
    if (monthFilter.getMonth() === 12) {
      to = new Date(monthFilter.getFullYear() + 1, 1, 1).toLocaleDateString()
    } else {
      to = new Date(
        monthFilter.getFullYear(),
        monthFilter.getMonth() + 1,
        1,
      ).toLocaleDateString()
    }

    return { from: from, to: to }
  }

  protected getRangeTime(year: string, month: string) {
    const fromDate = new Date()

    const years = Number(year)
    const months = Number(month)

    fromDate.setUTCMonth(months, 1)
    fromDate.setUTCFullYear(years)
    fromDate.setUTCHours(0, 0, 0, 1)

    const toDate = new Date()

    toDate.setUTCMonth(toDate.getMonth() + 1)
    toDate.setUTCHours(23, 59, 59, 999)
    toDate.setUTCDate(0)

    const from = new Date(fromDate.getTime() - ORDER_COMPLETE_DURATION)
    const to = new Date(toDate.getTime() - ORDER_COMPLETE_DURATION)

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }

  protected getDateInMonth(year: string, month: string) {
    const fromDate = new Date()
    const years = Number(year)
    const months = Number(month)

    fromDate.setUTCMonth(months - 1, 1)
    fromDate.setUTCFullYear(years)
    fromDate.setUTCHours(0, 0, 0, 1)

    const toDate = new Date()

    toDate.setUTCFullYear(years)
    toDate.setUTCMonth(months)
    toDate.setUTCHours(23, 59, 59, 999)
    toDate.setUTCDate(0)

    const from = new Date(fromDate.getTime() - ORDER_COMPLETE_DURATION)
    const to = new Date(toDate.getTime() - ORDER_COMPLETE_DURATION)

    return { from: from.toISOString(), to: to.toISOString() }
  }

  async getTotalPurchases(customerId: string) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    const query = buildQuery({
      customer_id: customerId,
      parent_id: Not(IsNull()),
    })
    return await oderRepo.count(query)
  }
  async listOrdersBuyer(
    customerId: string,
    selector: Selector<NewOrder>,
    config: FindConfig<NewOrder>,
  ) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    config.select.push('cancel_status')
    const query = buildQuery(
      { ...selector, customer_id: customerId, parent_id: Not(IsNull()) },
      config,
    ) as ExtendedFindConfig<Order>
    switch (selector['status']) {
      case OrderDisplayStatusEnum.NEW_ORDER as unknown as OrderStatus:
        query.where = [
          {
            customer_id: customerId,
            status: 'pending',
            payment_status: In(['not_paid', 'awaiting', 'captured']),
            fulfillment_status: 'not_fulfilled',
            parent_id: Not(IsNull()),
          },
        ]
        break
      case OrderDisplayStatusEnum.PREPARING_TO_SHIP as unknown as OrderStatus:
        query.where = [
          {
            customer_id: customerId,
            status: 'pending',
            fulfillment_status: 'fulfilled',
            parent_id: Not(IsNull()),
          },
        ]
        break
      case OrderDisplayStatusEnum.SHIPPING_COMPLETED as unknown as OrderStatus:
        query.where = [
          {
            customer_id: customerId,
            status: 'pending',
            fulfillment_status: 'shipped',
            parent_id: Not(IsNull()),
          },
        ]
        break
      case OrderDisplayStatusEnum.TRANSACTION_COMPLETED as unknown as OrderStatus:
        query.where = [
          {
            customer_id: customerId,
            status: 'completed',
            parent_id: Not(IsNull()),
          },
        ]
        break
      case OrderDisplayStatusEnum.CANCEL as unknown as OrderStatus:
        query.where = [
          {
            customer_id: customerId,
            status: 'canceled',
            parent_id: Not(IsNull()),
          },
        ]
        break
      case OrderDisplayStatusEnum.RETURNS as unknown as OrderStatus:
        query.where = [
          {
            customer_id: customerId,
            // status: 'return',
            parent_id: Not(IsNull()),
          },
        ]
        break
      default:
        query.where = [
          {
            customer_id: customerId,
            parent_id: Not(IsNull()),
          },
        ]
        break
    }
    const { select, relations } = this.transformQueryForTotals(
      config as FindConfig<Order>,
    )
    query.select = select
    delete query.relations

    relations.push('store')

    let raw = await oderRepo.findWithRelations(relations, query)
    const count = await oderRepo.count(query)

    raw = await Promise.all(
      raw.map(async (i: NewOrder) => {
        return await this.decorateVariantOptions(i)
      }),
    )

    const orders = await Promise.all(
      raw.map(async (i) => await this.convertOrders(i as NewOrder)),
    )

    return [orders, count]
  }
  async listTransactionBuyer(
    customerId: string,
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const query = buildQuery(selector, {
      ...config,
      order: { updated_at: 'DESC' },
    })
    query.where = [
      {
        customer_id: customerId,
        status: 'canceled',
        parent_id: Not(IsNull()),
        cancel_status: 'cancel_request',
      },
      {
        customer_id: customerId,
        status: 'pending',
        payment_status: In(['not_paid', 'awaiting', 'captured']),
        fulfillment_status: In(['not_fulfilled', 'fulfilled']),
        parent_id: Not(IsNull()),
      },
    ]
    query.relations = [
      'store',
      'items',
      'region',
      'customer',
      'items.line_item_addons',
      'items.line_item_addons.lv1',
      'items.line_item_addons.lv2',
    ]
    return await oderRepo.findAndCount(query)
  }

  async listTransactionStore(
    storeId: string,
    selector: Selector<Order>,
    config: FindConfig<Order>,
  ) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    const store = await this.storeService.getStoreById(
      { id: storeId },
      { select: ['owner_id'] },
    )

    const query = buildQuery(selector, {
      ...config,
      order: { updated_at: 'DESC' },
    })

    query.where = [
      {
        store_id: storeId,
        status: 'canceled',
        parent_id: Not(IsNull()),
        cancel_status: 'cancel_request',
      },
      {
        store_id: storeId,
        status: 'pending',
        payment_status: In(['not_paid', 'awaiting', 'captured']),
        fulfillment_status: In(['not_fulfilled', 'fulfilled']),
        parent_id: Not(IsNull()),
      },
      {
        customer_id: store.owner_id,
        status: 'canceled',
        parent_id: Not(IsNull()),
        cancel_status: 'cancel_request',
      },
      {
        customer_id: store.owner_id,
        status: 'pending',
        payment_status: In(['not_paid', 'awaiting', 'captured']),
        fulfillment_status: In(['not_fulfilled', 'fulfilled']),
        parent_id: Not(IsNull()),
      },
    ]
    query.relations = [
      'store',
      'items',
      'region',
      'customer',
      'items.line_item_addons',
      'items.line_item_addons.lv1',
      'items.line_item_addons.lv2',
    ]
    return await oderRepo.findAndCount(query)
  }

  async updateOrderFulfillmentStatus(orderId: string) {
    return this.atomicPhase_(async (transactionManager) => {
      const oderRepo = transactionManager.getCustomRepository(
        this.orderRepository_,
      )
      const order = (await this.retrieveDetail(orderId, {
        relations: defaultStoreOrdersRelations,
      })) as NewOrder
      const config = loadConfig()

      if (!order) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Can not found the order with id ${orderId}`,
        )
      }

      // temporary omit the fulfillment status condition => will add later
      if (
        !(
          order.status === OrderStatus.PENDING &&
          // order.fulfillment_status === FulfillmentStatus.FULFILLED &&
          order.payment_status === PaymentStatus.CAPTURED
        )
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Can not change fulfillment status the order with id ${orderId}`,
        )
      }
      order.fulfillment_status = FulfillmentStatus.SHIPPED
      order.shipped_at = new Date()
      const res = await oderRepo.save(order)

      const emailOrder = this.convertToEmailOrder(order)

      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(OrderService.Events.SHIPMENT_COMPLETE, {
          id: orderId,
          email: emailOrder.customer.email,
          format: 'order-shipment-complete',
          no_notification: emailOrder.no_notification,
          customer_id: emailOrder.customer_id,
          data: {
            order: emailOrder,
            purchase_history_detail_link:
              config.frontendUrl.purchaseHistoryDetail(emailOrder.id),
            contact_link: config.frontendUrl.contact,
            purchase_review_link: config.frontendUrl.purchaseReview(
              emailOrder.id,
            ),
          },
        })

      return res
    })
  }

  async decorateVariantOptions(order: NewOrder): Promise<Order> {
    // const orderRepo = this.manager.getCustomRepository(this.orderRepository_)
    const productOptionValueRepo = this.manager.getCustomRepository(
      this.productOptionValueRepo,
    )

    if (order.items && order.shipping_address) {
      order.items = await Promise.all(
        order.items.map(async (item: LineItem) => {
          const options = await productOptionValueRepo.find({
            where: { variant_id: item.variant_id },
          })
          item.variant.options = options
          if (item.shipping_method?.shipping_option?.provider_id) {
            item.shipping_method.shipping_option.provider =
              // @ts-ignore
              await this.fulfillmentProviderService_.retrieve(
                item.shipping_method.shipping_option.provider_id,
                { select: ['id', 'is_free', 'name'] },
              )
          }
          return item
        }),
      )

      order.items?.sort((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? 1 : -1,
      )

      const prefectureId = order.shipping_address?.province
      if (prefectureId) {
        const prefecture = await this.prefectureService.retrieve(prefectureId, {
          select: ['id', 'name'],
        })

        // @ts-ignore
        order.shipping_address.prefecture = prefecture
      }
    }

    return order
  }

  async retrieveDetail(
    orderId: string,
    config: FindConfig<Order> = {},
  ): Promise<Order> {
    const raw = (await super.retrieve(orderId, config)) as NewOrder

    raw.gift_cover_total = await this.totalsService.getGiftCoverTotal(raw)
    raw.total += raw.gift_cover_total
    raw.original_total = raw.total

    if (raw.parent_id) {
      const pointDiscount = raw.discounts.find(
        (d: Discount) => d.type === DiscountType.POINT,
      )
      const promoCodeDiscount = raw.discounts.find(
        (d: Discount) => d.type === DiscountType.PROMO_CODE,
      )

      if (pointDiscount) {
        raw.point_used = pointDiscount.rule.value
        raw.original_total += pointDiscount.rule.value
      }

      if (promoCodeDiscount) {
        // get parent discount code
        const parentCode = promoCodeDiscount.parent_discount?.code as string
        //  const parentDiscount = this.discountService_.retrieveByCode()
        if (parentCode) {
          raw.promo_code_used = parentCode
          raw.original_total += promoCodeDiscount.rule.value
          raw.coupon_total += promoCodeDiscount.rule.value
        }
      }
    } else {
      raw.original_total = raw.total
    }

    return this.decorateVariantOptions(raw as NewOrder)
  }

  calculatePromoCode(order: NewOrder) {
    if (order.parent_id) {
      const promoCodeDiscount = order.discounts.find(
        (d: Discount) => d.type === DiscountType.PROMO_CODE,
      )
      if (promoCodeDiscount) {
        // get parent discount code
        const parentCode = promoCodeDiscount.parent_discount?.code as string
        //  const parentDiscount = this.discountService_.retrieveByCode()
        if (parentCode) {
          order.promo_code_used = parentCode
        }
      }
    }
  }

  buildQuery_(
    selector: object,
    config: { relations: string[]; select: string[] },
  ): object {
    if (
      Object.keys(this.container).includes('loggedInUser') &&
      this.container.loggedInUser.store_id
    ) {
      selector['store_id'] = this.container.loggedInUser.store_id
    }

    config.select.push('store_id')

    config.relations = config.relations ?? []

    config.relations.push('children', 'parent', 'store')

    return buildQuery(selector, config)
  }

  async validOrderStoreOwner(order: NewOrder) {
    if (order?.store_id !== this.container.loggedInUser?.store_id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
    }
  }

  async requestCancel(orderId: string, data: RequestCancelParams) {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getCustomRepository(this.orderRepository_)
      const order = (await this.retrieveDetail(orderId, {
        // @ts-ignore
        select: defaultStoreOrdersFields.concat([
          'cancel_status',
          'parent_id',
          'metadata',
          'store_id',
          'cancel_reason',
        ]),
        relations: defaultStoreOrdersRelations.concat([
          'items.line_item_addons',
          'items.line_item_addons.lv1',
          'items.line_item_addons.lv2',
          'items.shipping_method',
        ]),
      })) as NewOrder

      await this.validOrderStoreOwner(order)

      const orderCanRequest = order.status === OrderStatus.PENDING
      const fulfillmentCanRequest =
        order.fulfillment_status === FulfillmentStatus.FULFILLED ||
        order.fulfillment_status === FulfillmentStatus.NOT_FULFILLED

      const canRequest = orderCanRequest && fulfillmentCanRequest

      if (!canRequest)
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Can not cancel the order with id ${orderId}`,
        )

      order.status = OrderStatus.CANCELED
      order.cancel_status = OrderCancelStatus.PENDING

      const res = await orderRepo.save(
        Object.assign(_.pick(order, ['id', 'cancel_status', 'status']), data),
      )

      const parent = await orderRepo.findOne(order.parent_id, {
        select: ['display_id', 'id'],
      })

      // send email for customer
      await this.eventBus_
        .withTransaction(manager)
        .emit(OrderService.Events.REQUEST_CANCEL, {
          id: orderId,
          email: order.customer.email,
          customer_id: order.customer.id,
          format: 'order-request-cancel',
          data: {
            order: this.convertToEmailOrder(order),
            purchaseHistoryDetailLink:
              loadConfig().frontendUrl.purchaseHistoryDetail(order.id),
            contactLink: loadConfig().frontendUrl.contact,
            parentDisplayId: parent.display_id,
          },
        })

      return res
    })
  }

  async closeRequestCancel(orderId: string) {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getCustomRepository(this.orderRepository_)
      const order = (await orderRepo.findOne(orderId)) as NewOrder

      await this.validOrderStoreOwner(order)

      const canCloseRequest = order.cancel_status === OrderCancelStatus.PENDING

      if (!canCloseRequest)
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Can not close cancel request the order with id ${orderId}`,
        )

      order.status = OrderStatus.PENDING
      order.cancel_status = null

      const res = await orderRepo.save(order)

      return res
    })
  }

  async cancel(orderId: string): Promise<Order> {
    return this.atomicPhase_(async (transactionManager) => {
      const orderRepo = transactionManager.getCustomRepository(
        this.orderRepository_,
      )
      const order = (await this.retrieveDetail(orderId, {
        // @ts-ignore
        select: defaultStoreOrdersFields.concat([
          'cancel_status',
          'parent_id',
          'metadata',
          'store_id',
          'cancel_reason',
          'refundable_amount',
        ]),
        relations: defaultStoreOrdersRelations.concat([
          'items.line_item_addons',
          'items.line_item_addons.lv1',
          'items.line_item_addons.lv2',
          'items.shipping_method',
          'store',
          'store.owner',
        ]),
      })) as NewOrder

      // const result = await super.cancel(orderId)

      const result = await this.handleCancel(orderId)

      // if cancel parent order => not refund
      if (!order.parent_id) return result

      if (
        order.cancel_status !== OrderCancelStatus.PENDING ||
        order.customer_id !== this.container.loggedInUser?.id
      ) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
      }

      await orderRepo.update(orderId, {
        // @ts-ignore
        cancel_status: OrderCancelStatus.CANCEL,
      })

      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(OrderService.Events.CANCEL_COMPLETE, {
          id: orderId,
          email: order.customer.email,
          format: 'order-cancel-complete',
          customer_id: order.customer_id,
          data: {
            order: this.convertToEmailOrder(order),
            pointListLink: loadConfig().frontendUrl.pointList,
            purchaseHistoryLink: loadConfig().frontendUrl.purchaseHistory,
            contactLink: loadConfig().frontendUrl.contact,
          },
        })

      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(OrderService.Events.CANCEL_COMPLETE_SHOP, {
          id: orderId,
          email: order.store.owner.email,
          format: 'cancel-order-complete-shop',
          data: {
            order: this.convertToEmailOrder(order),
          },
        })

      return result as Order
    })
  }

  async handleCancel(orderId: string): Promise<Order> {
    return await this.atomicPhase_(async (manager) => {
      const order = (await this.retrieve(orderId, {
        relations: [
          'fulfillments',
          'payments',
          'returns',
          'claims',
          'swaps',
          'items',
        ],
      })) as NewOrder

      if (order.refunds?.length > 0) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Order with refund(s) cannot be canceled',
        )
      }

      const throwErrorIf = (
        arr: (Fulfillment | Return | Swap | ClaimOrder)[],
        pred: (obj: Fulfillment | Return | Swap | ClaimOrder) => boolean,
        type: string,
      ): void | never => {
        if (arr?.filter(pred).length) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `All ${type} must be canceled before canceling an order`,
          )
        }
      }

      const notCanceled = (o): boolean => !o.canceled_at

      throwErrorIf(order.fulfillments, notCanceled, 'fulfillments')
      throwErrorIf(
        order.returns,
        (r) => (r as Return).status !== 'canceled',
        'returns',
      )
      throwErrorIf(order.swaps, notCanceled, 'swaps')
      throwErrorIf(order.claims, notCanceled, 'claims')

      if (order.parent_id) {
        const inventoryServiceTx =
          this.inventoryService_.withTransaction(manager)
        for (const item of order.items) {
          await inventoryServiceTx.adjustInventory(
            item.variant_id,
            item.quantity,
          )
        }
      } else {
        await this.returnDiscountWithCancelOrder(order.id)
      }

      const paymentProviderServiceTx =
        this.paymentProviderService_.withTransaction(manager)
      for (const p of order.payments) {
        await paymentProviderServiceTx.cancelPayment(p)
      }

      order.status = OrderStatus.CANCELED
      order.fulfillment_status = FulfillmentStatus.CANCELED
      order.payment_status = PaymentStatus.CANCELED
      order.canceled_at = new Date()

      const orderRepo = manager.getCustomRepository(this.orderRepository_)
      const result = await orderRepo.save(order)

      await this.eventBus_
        .withTransaction(manager)
        .emit(OrderService.Events.CANCELED, {
          id: order.id,
          no_notification: order.no_notification,
        })
      return result
    })
  }

  async updateOrderCms(
    orderId: string,
    data?: UpdateOrderCmsParams,
  ): Promise<Order> {
    const orderRepo = this.manager.getCustomRepository(this.orderRepository_)
    const order = (await this.retrieve(orderId)) as NewOrder
    switch (data.status) {
      case OrderStatusEnum.NEW_ORDER:
        order.fulfillment_status = FulfillmentStatus.NOT_FULFILLED
        order.payment_status = PaymentStatus.CAPTURED
        order.status = OrderStatus.PENDING
        break
      case OrderStatusEnum.PREPARING_TO_SHIP:
        order.fulfillment_status = FulfillmentStatus.FULFILLED
        order.payment_status = PaymentStatus.CAPTURED
        order.status = OrderStatus.PENDING
        break
      case OrderStatusEnum.SHIPPING_COMPLETED:
        order.fulfillment_status = FulfillmentStatus.SHIPPED
        order.payment_status = PaymentStatus.CAPTURED
        order.status = OrderStatus.PENDING
        order.shipped_at = new Date()
        break
      case OrderStatusEnum.TRANSACTION_COMPLETED:
        order.fulfillment_status = FulfillmentStatus.SHIPPED
        order.payment_status = PaymentStatus.CAPTURED
        order.status = OrderStatus.COMPLETED
        break
      case OrderStatusEnum.CANCEL:
        order.status = OrderStatus.CANCELED
        break
      case OrderStatusEnum.RETURNS:
        order.status = OrderStatus.PENDING
        order.fulfillment_status = FulfillmentStatus.RETURNED
        break

      default:
        break
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, metadata, ...rest } = data

    // just update note and preferred_received_at in metadata
    order.metadata.note = metadata?.note
    order.metadata.preferred_received_at = metadata?.preferred_received_at

    const update: DeepPartial<Order> = { ...order, ...rest }
    return await orderRepo.save(update)
  }

  convertToEmailOrder(order: NewOrder) {
    const cloned: any = { ...order }
    cloned.created_at = convertToDateTime(order.created_at)

    cloned.items = cloned.items.map((item: LineItem) => ({
      ...item,
      url: loadConfig().frontendUrl.productDetail(item.variant.product_id),
    }))

    return cloned
  }

  async getTotalAmountOrder(customerId: string) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    const orderIds = await oderRepo
      .createQueryBuilder('order')
      .select('order.id')
      .where('order.parent_id is not null and customer_id = :customerId', {
        customerId: customerId,
      })
      .getRawMany()

    if (orderIds.length < 1) {
      return []
    }

    const paymentRepo = this.manager_.getCustomRepository(
      this.paymentRepository,
    )

    const ids = []
    orderIds.map((item) => {
      ids.push(item.order_id)
    })

    const total = await paymentRepo
      .createQueryBuilder('payment')
      .select('sum(payment.amount) as total_amount')
      .where('order_id IN (:...ids) AND captured_at is not null', { ids: ids })
      .getRawMany()

    return total
  }

  async getBillingForOrder(
    storeId: string,
    selector: Selector<NewOrder>,
    config: FindConfig<NewOrder>,
  ): Promise<[Order[], number]> {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const query = buildQuery(
      { ...selector, store_id: storeId, parent_id: Not(IsNull()) },
      config,
    )
    const { select, relations } = this.transformQueryForTotals(
      config as ExtendedFindConfig<Order>,
    )
    query.select = select
    delete query.relations
    query.relations = ['customer']

    if (selector['year'] && selector['month']) {
      const { from, to } = this.getDateInMonth(
        selector['year'],
        selector['month'],
      )
      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          shipped_at: Between(from, to),
          fulfillment_status: 'shipped',
          status: 'completed',
        },
      ]
    }

    query.select = query.select.concat('shipped_at')

    relations.push('billing_address')

    const raw = await oderRepo.findWithRelations(
      relations,
      query as ExtendedFindConfig<Order>,
    )

    const count = await oderRepo.count(query as ExtendedFindConfig<Order>)

    const rl = []

    for (const r of raw) {
      // @ts-ignore
      r.items = await Promise.all(
        r.items.map(async (item: LineItem) => {
          const itemsTotal = await this.totalsService.getLineItemTotals(
            item,
            r as any,
          )
          return Object.assign(item, itemsTotal)
        }),
      )

      rl.push(r)
    }

    const orders = await Promise.all(
      rl.map(async (i) => await this.convertOrders(i)),
    )

    const results = await Promise.all(
      orders.map(async (i) => await this.convertBilling(i, storeId)),
    )

    return [results, count]
  }

  async convertBilling(order: NewOrder, storeId: string) {
    const store = await this.storeService.getStoreById(
      { id: storeId },
      {
        select: [
          'plan_type',
          'margin_rate',
          'spec_rate',
          'spec_starts_at',
          'spec_ends_at',
        ],
      },
    )
    let margin_rate = MARGIN_RATE_STD
    let spec_rate
    let spec_starts_at
    let spec_ends_at

    if (store.plan_type === StorePlanType.PRIME) {
      margin_rate = MARGIN_RATE_PRM
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    } else {
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    }

    let price: PriceOrderMetadata = order.metadata.price
    if (!price) {
      const raw = await this.retrieveDetail(order.id, {
        select: defaultStoreOrdersFields,
        relations: defaultStoreOrdersRelations.concat([
          'items.line_item_addons',
          'items.line_item_addons.lv1',
          'items.line_item_addons.lv2',
          'items.shipping_method',
          'discounts.parent_discount',
        ]),
      })
      price = await this.capturePrice(raw as NewOrder)
    }

    if (spec_ends_at && spec_starts_at) {
      if (
        order.created_at > spec_starts_at &&
        order.created_at < spec_ends_at
      ) {
        const billing = Object()

        billing.total = price?.subtotal || 0

        billing.fee_total = Math.round(
          (price?.subtotal || 0) * (spec_rate / 100),
        )

        billing.shipping_total = price?.shipping_total || 0

        billing.discount_total = price?.discount_total || 0

        if (store.plan_type === StorePlanType.PRIME) {
          billing.subtotal = billing.total - billing.fee_total
        } else {
          billing.subtotal =
            billing.total + billing.shipping_total - billing.fee_total
        }

        order.metadata = { ...order.metadata, billing }
        return order
      } else {
        const billing = Object()
        billing.total = price?.subtotal || 0

        billing.shipping_total = price?.shipping_total || 0

        billing.discount_total = price?.discount_total || 0

        billing.fee_total = Math.round(
          (price?.subtotal || 0) * (margin_rate / 100),
        )

        if (store.plan_type === StorePlanType.PRIME) {
          billing.subtotal = billing.total - billing.fee_total
        } else {
          billing.subtotal =
            billing.total + billing.shipping_total - billing.fee_total
        }

        order.metadata = { ...order.metadata, billing }
        return order
      }
    } else {
      const billing = Object()
      billing.total = price?.subtotal || 0

      billing.shipping_total = price?.shipping_total || 0

      billing.discount_total = price?.discount_total || 0

      billing.fee_total = Math.round(
        (price?.subtotal || 0) * (margin_rate / 100),
      )

      if (store.plan_type === StorePlanType.PRIME) {
        billing.subtotal = billing.total - billing.fee_total
      } else {
        billing.subtotal =
          billing.total + billing.shipping_total - billing.fee_total
      }

      order.metadata = { ...order.metadata, billing }
      return order
    }
  }

  public async getTotalOfBilling(billingId: string) {
    const storeBillRepo = this.manager_.getCustomRepository(
      this.storeBillingRepository,
    )

    const bill = await storeBillRepo.findOne(billingId)

    const toMonth = bill.created_at.getMonth().toString()
    const toYear = bill.created_at.getFullYear().toString()

    const to = this.getTo(toYear, toMonth)

    const nBill = await storeBillRepo.findOne({
      created_at: LessThan(bill.created_at),
      store_id: bill.store_id,
    })

    let fromMonth = undefined
    let fromYear = undefined
    if (nBill) {
      fromMonth = nBill.created_at.getUTCMonth()
      fromYear = nBill.created_at.getFullYear()
    }

    let from = undefined
    if ((fromMonth && fromYear) || (fromMonth === 0 && fromYear)) {
      from = this.getFrom(fromYear, fromMonth)
    }

    const store = await this.storeService.getStoreById(
      { id: bill.store_id },
      {
        select: [
          'plan_type',
          'margin_rate',
          'spec_rate',
          'spec_starts_at',
          'spec_ends_at',
        ],
      },
    )
    let margin_rate = 5
    let spec_rate
    let spec_starts_at
    let spec_ends_at

    if (store.plan_type === StorePlanType.PRIME) {
      margin_rate = 18
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    } else {
      if (!store.spec_rate || store.spec_rate === 0) {
        if (store.margin_rate) {
          margin_rate = store.margin_rate
        }
      } else {
        spec_starts_at = store.spec_starts_at
        spec_ends_at = store.spec_ends_at
      }
    }

    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)
    const query = buildQuery(
      { store_id: bill.store_id, parent_id: Not(IsNull()) },
      { select: ['id', 'metadata', 'created_at'] },
    )

    if (from !== undefined) {
      query.where = [
        {
          store_id: bill.store_id,
          parent_id: Not(IsNull()),
          shipped_at: Between(from, to),
          fulfillment_status: 'shipped',
          status: 'completed',
        },
      ]
    } else {
      query.where = [
        {
          store_id: bill.store_id,
          parent_id: Not(IsNull()),
          fulfillment_status: 'shipped',
          shipped_at: LessThanOrEqual(to),
          status: 'completed',
        },
      ]
    }
    const orders = await oderRepo.find(query)

    const result = {
      total: 0,
      subtotal: 0,
      fee_total: 0,
      shipping_total: 0,
      discount_total: 0,
      tax_total: 0,
    }

    for (const order of orders) {
      let price: PriceOrderMetadata = order.metadata.price
      if (!price) {
        const raw = await this.retrieveDetail(order.id, {
          select: defaultStoreOrdersFields,
          relations: defaultStoreOrdersRelations.concat([
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
            'items.shipping_method',
            'discounts.parent_discount',
          ]),
        })
        price = await this.capturePrice(raw as NewOrder)
      }

      if (spec_ends_at && spec_starts_at) {
        if (
          order.created_at > spec_starts_at &&
          order.created_at < spec_ends_at
        ) {
          result.total = result.total + (price?.subtotal || 0)

          result.fee_total =
            result.fee_total + (price?.subtotal || 0) * (spec_rate / 100)

          result.shipping_total =
            result.shipping_total + (price?.shipping_total || 0)

          result.discount_total =
            result.discount_total + (price?.discount_total || 0)
        } else {
          result.total = result.total + (price?.subtotal || 0)

          result.shipping_total =
            result.shipping_total + (price?.shipping_total || 0)

          result.discount_total =
            result.discount_total + (price?.discount_total || 0)

          result.fee_total =
            result.fee_total + (price?.subtotal || 0) * (margin_rate / 100)
        }
      } else {
        result.total = result.total + (price?.subtotal || 0)

        result.shipping_total =
          result.shipping_total + (price?.shipping_total || 0)

        result.discount_total =
          result.discount_total + (price?.discount_total || 0)

        result.fee_total =
          result.fee_total + (price?.subtotal || 0) * (margin_rate / 100)
      }
    }

    if (store.plan_type === StorePlanType.PRIME) {
      result.subtotal = result.total - Math.round(result.fee_total)
    } else {
      result.subtotal =
        result.total + result.shipping_total - Math.round(result.fee_total)
    }

    return {
      total: Math.round(result.total) || 0,
      shipping_total: Math.round(result.shipping_total) || 0,
      discount_total: Math.round(result.discount_total) || 0,
      tax_total: Math.round(result.tax_total) || 0,
      subtotal: Math.round(result.subtotal) || 0,
      fee_total: Math.round(result.fee_total) || 0,
    }
  }

  protected getFrom(year: string, month: string) {
    const date = new Date()

    const years = Number(year)
    const months = Number(month)

    if (months === 0) {
      date.setUTCMonth(1, 1)
    } else {
      date.setUTCMonth(months + 1, 1)
    }
    date.setUTCFullYear(years)
    date.setUTCHours(0, 0, 0, 1)

    const from = new Date(date.getTime() - ORDER_COMPLETE_DURATION)

    return from.toISOString()
  }

  protected getTo(year: string, month: string) {
    const date = new Date()

    const years = Number(year)
    const months = Number(month)

    date.setUTCMonth(months + 1, 1)
    date.setUTCFullYear(years)
    date.setUTCHours(23, 59, 59, 999)

    const to = new Date(date.getTime() - ORDER_COMPLETE_DURATION)

    return to.toISOString()
  }

  async setPriceMetadata(order: Order) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const raw = await this.retrieveDetail(order.id, {
      select: defaultStoreOrdersFields,
      relations: defaultStoreOrdersRelations,
    })

    const metadata = (raw.metadata || {}) as any
    metadata.price = await this.capturePrice(raw as NewOrder)

    return await oderRepo.save(raw)
  }

  async setLineItem(o: Order) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    const order = await this.retrieveDetail(o.id, {
      select: defaultStoreOrdersFields.concat(['metadata']),
      relations: defaultStoreOrdersRelations,
    })

    const metadata = (order.metadata || {}) as any

    metadata.item_total = {}
    metadata.shipping_total = {}
    for (const e of order.items) {
      // @ts-ignore
      metadata.shipping_total[e.id] = e?.shipping_total || 0
      metadata.item_total[e.id] = e?.total || 0
    }
    return await oderRepo.save(order)
  }

  async returnDiscountWithCancelOrder(orderId: string) {
    return await this.atomicPhase_(async (manager) => {
      const orderDiscountsRepo = manager.getCustomRepository(
        this.orderDiscountsRepo,
      )

      const discountRepo = manager.getCustomRepository(this.discountRepo)

      const userDiscountRepo = manager.getCustomRepository(
        this.userDiscountRepo,
      )

      const query = buildQuery(
        { order_id: orderId },
        { relations: ['discount', 'discount.rule', 'order'] },
      )
      const data = await orderDiscountsRepo.find(query)

      if (!data?.length) {
        return
      }

      await Promise.all(
        data.map(async (e) => {
          const discount = e.discount
          const order = e.order
          if (
            discount.type === DiscountType.PROMO_CODE ||
            discount.type === DiscountType.COUPON
          ) {
            discount.usage_count = discount.usage_count - 1
            await discountRepo.save(discount)

            await userDiscountRepo.delete({
              user_id: order.customer_id,
              discount_id: discount.id,
            })
          }
        }),
      )

      return
    })
  }
}

interface OrderNotificationData {
  id: string
  format: string
  email: string
  data: object
  customer_id?: string
}
