/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  defaultStoreOrdersFields,
  defaultStoreOrdersRelations,
  DiscountRuleType,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '@medusajs/medusa'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment'
import { ShippingMethodRepository } from '@medusajs/medusa/dist/repositories/shipping-method'
import { EventBusService, ReturnService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Subscriber } from 'medusa-extender'
import { EntityManager } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { convertPointToMoney } from '../../../helpers/point'
import { LineItem } from '../../cart/entity/line-item.entity'
import { DiscountConditionRepository } from '../../discount/repository/discount-condition.repository'
import { PointService } from '../../point/services/point.service'
import { Product } from '../../product/entity/product.entity'
import { ProductService } from '../../product/services/product.service'
import { SeqService } from '../../seq/seq.service'
import { StorePlanType } from '../../store/entity/store.entity'
import StoreRepository from '../../store/repository/store.repository'
import StoreService from '../../store/services/store.service'
import UserService from '../../user/services/user.service'
import { Order } from '../entity/order.entity'
import { OrderRepository } from '../repository/order.repository'
import { OrderService } from '../services/order.service'
import {
  EAST_ASIA_REGION_ID,
  GMO_CARD_LABEL,
} from './../../../helpers/constant'
import { LineItemAddonsRepository } from './../../cart/repository/line-item-addons.repository'
import { LineItemService } from './../../cart/services/line-item.service'
import { TotalsService } from './../../cart/services/totals.service'
import {
  Discount,
  DiscountType,
  StoreApplyEnum,
} from './../../discount/entities/discount.entity'
import { DiscountService } from './../../discount/services/discount.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  orderService: OrderService
  orderRepository: typeof OrderRepository
  productService: ProductService
  manager: EntityManager
  lineItemRepository: typeof LineItemRepository
  shippingMethodRepository: typeof ShippingMethodRepository
  paymentRepository: typeof PaymentRepository
  lineItemService: LineItemService
  lineItemAddonsRepository: typeof LineItemAddonsRepository
  pointService: PointService
  discountService: DiscountService
  seqService: SeqService
  logger: Logger
  totalsService: TotalsService
  returnService: ReturnService
  storeService: StoreService
  userService: UserService
  discountConditionRepository: typeof DiscountConditionRepository
  moneyAmountRepository: typeof MoneyAmountRepository
  storeRepository: typeof StoreRepository
}

@Subscriber()
export class OrderSubscriber {
  private readonly manager: EntityManager
  private readonly eventBusService: EventBusService
  private readonly orderService: OrderService
  private readonly orderRepository: typeof OrderRepository
  private readonly productService: ProductService
  private readonly lineItemRepository: typeof LineItemRepository
  private readonly shippingMethodRepository: typeof ShippingMethodRepository
  private readonly lineItemService: LineItemService
  private readonly lineItemAddonsRepo: typeof LineItemAddonsRepository
  private readonly pointService: PointService
  private readonly discountService: DiscountService
  private readonly paymentRepository: typeof PaymentRepository
  private readonly seqService: SeqService
  private readonly totalsService: TotalsService
  private readonly returnService: ReturnService
  private readonly storeService: StoreService
  private readonly userService: UserService
  protected storeRepo_: typeof StoreRepository

  private logger_: Logger
  private readonly disConditionRepo_: typeof DiscountConditionRepository
  protected readonly moneyAmountRepo_: typeof MoneyAmountRepository

  constructor({
    eventBusService,
    orderService,
    orderRepository,
    productService,
    manager,
    lineItemRepository,
    shippingMethodRepository,
    lineItemService,
    lineItemAddonsRepository,
    pointService,
    paymentRepository,
    discountService,
    seqService,
    totalsService,
    storeService,
    logger,
    returnService,
    userService,
    discountConditionRepository,
    moneyAmountRepository,
    storeRepository,
  }: InjectedDependencies) {
    this.eventBusService = eventBusService
    this.orderService = orderService
    this.orderRepository = orderRepository
    this.productService = productService
    this.manager = manager
    this.lineItemRepository = lineItemRepository
    this.shippingMethodRepository = shippingMethodRepository
    this.lineItemService = lineItemService
    this.lineItemAddonsRepo = lineItemAddonsRepository
    this.pointService = pointService
    this.paymentRepository = paymentRepository
    this.discountService = discountService
    this.seqService = seqService
    this.totalsService = totalsService
    this.returnService = returnService
    this.storeService = storeService
    this.logger_ = logger
    this.userService = userService
    this.disConditionRepo_ = discountConditionRepository
    this.moneyAmountRepo_ = moneyAmountRepository
    this.storeRepo_ = storeRepository

    this.eventBusService.subscribe(
      OrderService.Events.PLACED,
      this.handleOrderPlaced.bind(this),
    )

    //add handler for different status changes
    this.eventBusService.subscribe(
      OrderService.Events.CANCELED,
      this.checkStatus.bind(this),
    )
    this.eventBusService.subscribe(
      OrderService.Events.UPDATED,
      this.checkStatus.bind(this),
    )
    this.eventBusService.subscribe(
      OrderService.Events.COMPLETED,
      this.checkStatus.bind(this),
    )

    this.eventBusService.subscribe(
      OrderService.Events.PAYMENT_CAPTURED,
      this.hanldePaymentStatusChange.bind(this),
    )

    this.eventBusService.subscribe(
      'order.return_requested',
      this.handleReturnOrderRequest.bind(this),
    )

    // testing
    // this.eventBusService.subscribe(
    //   OrderService.Events.PLACED,
    //   this.handleOrderPlacedNew.bind(this),
    // )
  }

  private async handleOrderPlaced({ id }: { id: string }) {
    this.logger_.debug(
      'Order place successfully ==> ' + id + ', at ' + new Date().toString(),
    )

    const disConditionRepo = this.manager.getCustomRepository(
      this.disConditionRepo_,
    )

    const orderRepo = this.manager.getCustomRepository(this.orderRepository)
    const lineItemRepo = this.manager.getCustomRepository(
      this.lineItemRepository,
    )
    const shippingMethodRepo = this.manager.getCustomRepository(
      this.shippingMethodRepository,
    )
    const lineItemAddonsRepo = this.manager.getCustomRepository(
      this.lineItemAddonsRepo,
    )
    const paymentRepo = this.manager.getCustomRepository(this.paymentRepository)

    //create child orders
    //retrieve order
    const order = (await this.orderService
      .withTransaction(this.manager)
      .retrieveDetail(id, {
        // @ts-ignore
        select: defaultStoreOrdersFields.concat([
          'cancel_status',
          'parent_id',
          'metadata',
        ]),
        relations: defaultStoreOrdersRelations.concat([
          'items.line_item_addons',
          'items.line_item_addons.lv1',
          'items.line_item_addons.lv2',
          'items.shipping_method',
          'billing_address',
        ]),
      })) as Order
    //group items by store id
    const groupedItems = {}

    const childrenIds: string[] = []

    await this.userService
      .withTransaction(this.manager)
      .update_(order.customer_id, {
        latest_used_at: order.created_at,
      })

    for (const item of order.items) {
      const product = (await this.productService.retrieve(
        item.variant.product_id,
        // @ts-ignore
        { select: ['store_id'] },
      )) as Product
      const store_id = product.store_id
      if (!store_id) {
        continue
      }
      if (!groupedItems.hasOwnProperty(store_id)) {
        groupedItems[store_id] = []
      }

      groupedItems[store_id].push(item)
    }

    const metadata: any = order.metadata
    const pointDiscount = order.discounts.find(
      (discount: Discount) => discount.type === DiscountType.POINT,
    )
    const promoCodeDiscount = order.discounts.find(
      (discount: Discount) => discount.type === DiscountType.PROMO_CODE,
    ) as Discount

    const couponDiscount = order.discounts.find(
      (discount: Discount) => discount.type === DiscountType.COUPON,
    ) as Discount

    for (const store_id in groupedItems) {
      const isExist = await orderRepo.findOne({ parent_id: order.id, store_id })
      if (isExist) continue
      const items: LineItem[] = groupedItems[store_id]
      const rawOrder = _.omit(order, ['items'])
      const orderSeq = await this.seqService
        .withTransaction(this.manager)
        .getOrderSeqByStoreId(store_id)

      // if store is standard
      // new order => fulfilled -> shipped -> transaction complete (shop and customer)
      // if store is premium
      // shop: new order => not fulflilled -> fulfilled -> shipped -> transaction complete after 14 days
      // customer: new order => prepare to ship (not fulfilled and fulfilled) -> shipped -> transaction complete after 14 days
      // const store = await this.storeService.retrieve_(store_id, {
      //   select: ['id', 'plan_type'],
      // })

      // const initOrderFulfillmentStatus =
      //   store.plan_type === StorePlanType.STANDARD
      //     ? FulfillmentStatus.FULFILLED
      //     : FulfillmentStatus.NOT_FULFILLED

      //create order
      const childOrder = orderRepo.create({
        ...rawOrder,
        parent_id: id,
        store_id: store_id,
        cart_id: null,
        cart: null,
        id: `${store_id}-${order.id}`,
        // id: null,
        shipping_methods: [],
        discounts: [],
        display_id: orderSeq,
        fulfillment_status: FulfillmentStatus.NOT_FULFILLED,
        metadata: metadata?.info?.find((i) => i.store_id === store_id) || {}, // for note and prefered delivery time
      }) as Order

      // server ip
      // childOrder.metadata.serverIP = ip.address()

      const orderResult = await orderRepo.save(childOrder)
      childrenIds.push(orderResult.id)

      this.logger_.debug(
        'Children order place successfully ==> ' +
          orderResult.id +
          ', at ' +
          new Date().toString(),
      )

      //create line items
      for (const item of items) {
        const newItem = lineItemRepo.create({
          ..._.omit(item, ['line_item_addons', 'id']),
          order_id: orderResult.id,
          cart_id: null,
        })
        const shippingMethod = order.shipping_methods.find(
          (sm) => sm.id === item.shipping_method_id,
        )

        // copy shipping method
        if (shippingMethod) {
          let newShippingMethod = shippingMethodRepo.create({
            ..._.omit(shippingMethod, ['id']),
            cart_id: null,
            order_id: orderResult.id,
          })
          newShippingMethod = await shippingMethodRepo.save(newShippingMethod)
          // @ts-ignore
          newItem.shipping_method = newShippingMethod
        }

        // add metadata of lineitem to capture price
        // newItem.metadata = {
        //   ...(newItem.metadata || {}),
        //   total: item.total,
        //   total_unit_price: item.total_unit_price,
        //   unit_price: item.unit_price,
        //   shipping_total: item.shipping_total,
        // }

        const savedItem = (await lineItemRepo.save(newItem)) as LineItem

        // copy line item addons
        await Promise.all(
          item.line_item_addons.map(async (addon) => {
            const toCreate = {
              ...addon,
              line_item_id: savedItem.id,
            }

            await lineItemAddonsRepo.save(toCreate)
          }),
        )
      }
    }

    if (!childrenIds.length) return

    // get all children after have all discounts
    let children: Order[] = await Promise.all(
      childrenIds.map(async (id) => {
        return (await this.orderService.retrieveDetail(id, {
          // @ts-ignore
          select: defaultStoreOrdersFields.concat(['parent_id']),
          relations: defaultStoreOrdersRelations.concat([
            'store',
            'store.owner',
            'store.store_detail',
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
            'items.shipping_method',
          ]),
        })) as Order
      }),
    )

    // TODO: create discount, coupon, promo code for children order here
    const rnOrders: Order[] = []
    const leftOrders: Order[] = []
    children.forEach((child) => {
      if (!!child.store.store_detail.registration_number) {
        rnOrders.push(child)
      } else {
        leftOrders.push(child)
      }
    })

    const predicate = (child1: Order, child2: Order) => {
      return child2.subtotal - child1.subtotal
    }

    rnOrders.sort(predicate)
    leftOrders.sort(predicate)

    let sortedOrders = rnOrders
      .concat(leftOrders)
      .map((o) => Object.assign(o, { left_subtotal: o.subtotal }))

    if (promoCodeDiscount) {
      // add order's customer to list users who already used this promocode discount
      await this.discountService.addUser2ListUsed(
        promoCodeDiscount.id,
        order.customer_id,
      )
      let total = 0
      if (promoCodeDiscount.rule.type === DiscountRuleType.FIXED) {
        total = promoCodeDiscount.rule.value
      }
      if (!promoCodeDiscount.store_id) {
        // apply to all store in the order
        for (let i = 0; i < sortedOrders.length; i++) {
          const o = sortedOrders[i]
          if (o.left_subtotal > 0) {
            let amount = 0

            for (const item of o.items) {
              const check = await disConditionRepo.canApplyForItem(
                promoCodeDiscount.rule_id,
                item as LineItem,
              )

              const isSale = await this.checkDiscountSale(
                promoCodeDiscount.is_sale,
                item as LineItem,
              )

              const isStoreApply = await this.checkStoreApplyStore(
                item as LineItem,
                promoCodeDiscount,
              )
              if (
                check &&
                isSale &&
                isStoreApply &&
                promoCodeDiscount.rule.type === DiscountRuleType.PERCENTAGE
              ) {
                amount += Math.floor(
                  (promoCodeDiscount.rule.value * item.subtotal) / 100,
                )
              }

              if (
                check &&
                isSale &&
                promoCodeDiscount.rule.type === DiscountRuleType.FIXED
              ) {
                if (item.subtotal > total) {
                  amount += total
                } else {
                  amount += item.subtotal
                  total -= item.subtotal
                }
              }
            }

            o.coupon_total += amount
            if (amount > 0) {
              const newDiscount = await this.discountService.create({
                code: uuid(),
                is_disabled: false,
                is_dynamic: false,
                rule: {
                  value: amount,
                  type: DiscountRuleType.FIXED,
                  allocation: null,
                },
                regions: [EAST_ASIA_REGION_ID],
                // @ts-ignore
                type: DiscountType.PROMO_CODE,
                metadata: { parent_code: promoCodeDiscount.code },
                parent_discount_id: promoCodeDiscount.id,
              })
              o.discounts.push(newDiscount)
            }
            o.total -= amount
            o.left_subtotal -= amount
          }
        }
      } else {
        // only apply to order of store the promotion code belongs to
        // find the order of that store
        const o = sortedOrders.find(
          (o) => o.store.id === promoCodeDiscount.store_id,
        )

        if (o) {
          let amount = 0

          for (const item of o.items) {
            const check = await disConditionRepo.canApplyForItem(
              promoCodeDiscount.rule_id,
              item as LineItem,
            )
            const isSale = await this.checkDiscountSale(
              promoCodeDiscount.is_sale,
              item as LineItem,
            )

            const isStoreApply = await this.checkStoreApplyStore(
              item as LineItem,
              promoCodeDiscount,
            )
            if (
              check &&
              isSale &&
              isStoreApply &&
              promoCodeDiscount.rule.type === DiscountRuleType.PERCENTAGE
            ) {
              amount += Math.floor(
                (promoCodeDiscount.rule.value * item.subtotal) / 100,
              )
            }

            if (
              check &&
              isSale &&
              promoCodeDiscount.rule.type === DiscountRuleType.FIXED
            ) {
              if (item.subtotal > total) {
                amount += total
              } else {
                amount += item.subtotal
                total -= item.subtotal
              }
            }
          }

          if (amount > 0) {
            const newDiscount = await this.discountService.create({
              code: uuid(),
              is_disabled: false,
              is_dynamic: false,
              rule: {
                value: amount,
                type: DiscountRuleType.FIXED,
                allocation: null,
              },
              regions: [EAST_ASIA_REGION_ID],
              // @ts-ignore
              type: DiscountType.PROMO_CODE,
              metadata: { parent_code: promoCodeDiscount.code },
              parent_discount_id: promoCodeDiscount.id,
            })
            o.discounts.push(newDiscount)
          }

          o.total -= amount
          o.left_subtotal -= amount
          o.coupon_total += amount

          sortedOrders = sortedOrders.map((so) => (so.id === o.id ? o : so))
        }
      }
    }

    if (couponDiscount) {
      // add order's customer to list users who already used this promocode discount
      await this.discountService.addUser2ListUsed(
        couponDiscount.id,
        order.customer_id,
      )
      let total = 0
      if (couponDiscount.rule.type === DiscountRuleType.FIXED) {
        total = couponDiscount.rule.value
      }
      if (!couponDiscount.store_id) {
        // apply to all store in the order
        for (let i = 0; i < sortedOrders.length; i++) {
          const o = sortedOrders[i]
          if (o.left_subtotal > 0) {
            let amount = 0

            for (const item of o.items) {
              const check = await disConditionRepo.canApplyForItem(
                couponDiscount.rule_id,
                item as LineItem,
              )
              const isSale = await this.checkDiscountSale(
                couponDiscount.is_sale,
                item as LineItem,
              )

              const isStoreApply = await this.checkStoreApplyStore(
                item as LineItem,
                couponDiscount,
              )
              if (
                check &&
                isSale &&
                isStoreApply &&
                couponDiscount.rule.type === DiscountRuleType.PERCENTAGE
              ) {
                amount += Math.floor(
                  (couponDiscount.rule.value * item.subtotal) / 100,
                )
              }

              if (
                check &&
                isSale &&
                couponDiscount.rule.type === DiscountRuleType.FIXED
              ) {
                if (item.subtotal > total) {
                  amount += total
                } else {
                  amount += item.subtotal
                  total -= item.subtotal
                }
              }
            }

            o.coupon_total += amount
            if (amount > 0) {
              const newDiscount = await this.discountService.create({
                code: uuid(),
                is_disabled: false,
                is_dynamic: false,
                rule: {
                  value: amount,
                  type: DiscountRuleType.FIXED,
                  allocation: null,
                },
                regions: [EAST_ASIA_REGION_ID],
                // @ts-ignore
                type: DiscountType.COUPON,
                metadata: { parent_code: couponDiscount.code },
                parent_discount_id: couponDiscount.id,
              })
              o.discounts.push(newDiscount)
            }
            o.total -= amount
            o.left_subtotal -= amount
          }
        }
      } else {
        // only apply to order of store the promotion code belongs to
        // find the order of that store
        const o = sortedOrders.find(
          (o) => o.store.id === couponDiscount.store_id,
        )

        if (o) {
          let amount = 0

          for (const item of o.items) {
            const check = await disConditionRepo.canApplyForItem(
              couponDiscount.rule_id,
              item as LineItem,
            )

            const isSale = await this.checkDiscountSale(
              couponDiscount.is_sale,
              item as LineItem,
            )

            const isStoreApply = await this.checkStoreApplyStore(
              item as LineItem,
              couponDiscount,
            )
            if (
              check &&
              isSale &&
              isStoreApply &&
              couponDiscount.rule.type === DiscountRuleType.PERCENTAGE
            ) {
              amount += Math.floor(
                (couponDiscount.rule.value * item.subtotal) / 100,
              )
            }

            if (
              check &&
              isSale &&
              isStoreApply &&
              couponDiscount.rule.type === DiscountRuleType.FIXED
            ) {
              if (item.subtotal > total) {
                amount += total
              } else {
                amount += item.subtotal
                total -= item.subtotal
              }
            }
          }

          if (amount > 0) {
            const newDiscount = await this.discountService.create({
              code: uuid(),
              is_disabled: false,
              is_dynamic: false,
              rule: {
                value: amount,
                type: DiscountRuleType.FIXED,
                allocation: null,
              },
              regions: [EAST_ASIA_REGION_ID],
              // @ts-ignore
              type: DiscountType.COUPON,
              metadata: { parent_code: couponDiscount.code },
              parent_discount_id: couponDiscount.id,
            })
            o.discounts.push(newDiscount)
          }

          o.total -= amount
          o.left_subtotal -= amount
          o.coupon_total += amount

          sortedOrders = sortedOrders.map((so) => (so.id === o.id ? o : so))
        }
      }
    }

    if (pointDiscount) {
      let leftPoint = pointDiscount?.rule.value || 0
      for (let i = 0; i < sortedOrders.length; i++) {
        const o = sortedOrders[i]
        const total = o.left_subtotal + o.shipping_total
        if (leftPoint > 0 && total > 0) {
          const amount = Math.min(total, convertPointToMoney(leftPoint))

          const newDiscount = await this.discountService.create({
            code: uuid(),
            is_disabled: false,
            is_dynamic: false,
            rule: {
              value: amount,
              type: DiscountRuleType.FIXED,
              allocation: null,
            },
            regions: [EAST_ASIA_REGION_ID],
            // @ts-ignore
            type: DiscountType.POINT,
            metadata: { parent_code: pointDiscount.code }, // discount.metadata.parent_code
            parent_discount_id: pointDiscount.id,
          })
          await this.pointService.create({
            amount: -amount,
            user_id: o.customer_id,
            message: `ポイント利用：${o.display_id}T`,
          })

          o.point_used += amount
          o.discounts.push(newDiscount)
          o.total -= amount
          leftPoint -= amount
        }
      }
    }

    // saved all the discounts and price metadata of child order
    for (const o of sortedOrders) {
      // if (o.discounts.length) {
      const metadata = (o.metadata || {}) as any
      metadata.price = metadata.price || {}

      metadata.price.total = o.total
      metadata.price.subtotal = o.items.reduce(
        (acc, item) => acc + item.subtotal,
        0,
      )
      metadata.price.shipping_total = await this.totalsService.getShippingTotal(
        o,
      )
      metadata.price.discount_total = await this.totalsService.getDiscountTotal(
        o,
      )

      metadata.item_total = {}
      metadata.shipping_total = {}
      for (const e of o.items) {
        // @ts-ignore
        metadata.shipping_total[e.id] = e?.shipping_total || 0
        metadata.item_total[e.id] = e?.total || 0
      }
      await this.orderService.update(o.id, { discounts: o.discounts, metadata })
    }

    // sync orders with new total
    children = children.map((o) => sortedOrders.find((i) => i.id === o.id))

    // calculate all discount of parent order
    const totalPointUsed = children.reduce(
      (acc, c) => c.point_used || 0 + acc,
      0,
    )
    const totalCouponDiscount = children.reduce(
      (acc, c) => c.coupon_total || 0 + acc,
      0,
    )
    order.point_used = totalPointUsed
    order.coupon_total = totalCouponDiscount

    // temporarily hard code to gmo card
    order.payment_method = GMO_CARD_LABEL
    // order.payments[0].provider_id === GMO_CARD_ID
    //   ? 'クレジットカード'
    //   : 'コンビニ'

    // capture payment when order is place successfully
    const capturedOrder = await this.orderService.capturePayment(order.id)

    // create payment for child order after parent order has been captured succesfully
    await Promise.all(
      children.map(async (child: Order) => {
        for (const payment of capturedOrder.payments) {
          const toSave = paymentRepo.create({
            ..._.omit(payment, ['id']),
            amount: child.total,
            cart_id: null,
            currency_code: child.region.currency_code,
            provider_id: payment.provider_id,
            data: { ...(payment.data || {}), amount: child.total },
            order_id: child.id,
          })

          await paymentRepo.save(toSave)
        }
      }),
    )

    // descrease point if that order using point
    // if (pointDiscount) {
    //   const usedPoint = pointDiscount.rule.value
    //   await this.pointService.create({
    //     amount: -usedPoint,
    //     user_id: order.customer_id,
    //     message: `ポイント利用　注文ID：${order.display_id}`,
    //   })
    // }

    // convert order to send mail
    children = children.map((o) => this.orderService.convertToEmailOrder(o))

    // send email order complete to the customer
    await this.eventBusService.emit(OrderService.Events.SETTLED, {
      id,
      email: order.customer.email,
      format: 'order-completion',
      customer_id: order.customer.id,
      data: {
        order: {
          ...this.orderService.convertToEmailOrder(order),
          children,
        },
      },
    })

    // send email to shops
    await Promise.all(
      children.map(async (child) => {
        if (child.store?.owner?.email) {
          if (child.store.plan_type === StorePlanType.PRIME) {
            await this.eventBusService.emit(OrderService.Events.SETTLED_SHOP, {
              id,
              email: child.store.owner?.email,
              format: 'order-completion-prime',
              customer_id: child.store.owner?.id,
              data: {
                order: child,
              },
            })
          } else {
            await this.eventBusService.emit(OrderService.Events.SETTLED_SHOP, {
              id,
              email: child.store.owner?.email,
              format: 'order-completion-shop',
              customer_id: child.store.owner?.id,
              data: {
                order: child,
              },
            })
          }
        }
      }),
    )

    // return order
    // })
  }

  public async checkStatus({ id }: { id: string }): Promise<void> {
    //retrieve order
    const order = (await this.orderService.retrieve(id)) as Order

    if (order.parent_id) {
      //retrieve parent
      const orderRepo = this.manager.getCustomRepository(this.orderRepository)
      const parentOrder = await this.orderService.retrieve(order.parent_id, {
        relations: ['children'],
      })

      const newStatus = this.getStatusFromChildren(parentOrder as Order)

      if (newStatus !== parentOrder.status) {
        switch (newStatus) {
          case OrderStatus.CANCELED:
            this.orderService.cancel(parentOrder.id)
            break
          case OrderStatus.ARCHIVED:
            this.orderService.archive(parentOrder.id)
            break
          case OrderStatus.COMPLETED:
            this.orderService.completeOrder(parentOrder.id)
            break
          default:
            parentOrder.status = newStatus as OrderStatus
            parentOrder.fulfillment_status = newStatus as FulfillmentStatus
            parentOrder.payment_status = newStatus as PaymentStatus
            await orderRepo.save(parentOrder)
        }
      }
    }
  }

  public getStatusFromChildren(order: Order): string {
    if (!order.children) {
      return order.status
    }

    //collect all statuses
    let statuses = order.children.map((child) => child.status)

    //remove duplicate statuses
    statuses = [...new Set(statuses)]

    if (statuses.length === 1) {
      return statuses[0]
    }

    //remove archived and canceled orders
    statuses = statuses.filter(
      (status) =>
        status !== OrderStatus.CANCELED && status !== OrderStatus.ARCHIVED,
    )

    if (!statuses.length) {
      //all child orders are archived or canceled
      return OrderStatus.CANCELED
    }

    if (statuses.length === 1) {
      return statuses[0]
    }

    //check if any order requires action
    const hasRequiresAction = statuses.some(
      (status) => status === OrderStatus.REQUIRES_ACTION,
    )
    if (hasRequiresAction) {
      return OrderStatus.REQUIRES_ACTION
    }

    //since more than one status is left and we filtered out canceled, archived,
    //and requires action statuses, only pending and complete left. So, return pending
    return OrderStatus.PENDING
  }

  async hanldePaymentStatusChange({ id }: { id: string }) {
    return await this.manager.transaction(async (transactionManager) => {
      const orderRepo = transactionManager.getCustomRepository(
        this.orderRepository,
      )
      const order = await orderRepo.findOne(id, {
        select: ['id', 'parent_id', 'payment_status'],
      })

      if (order.parent_id !== null) return

      const orderChildren = await orderRepo.find({ parent_id: order.id })

      // update all child order payment status to captured
      return await Promise.all(
        orderChildren.map(async (orderChild) => {
          await orderRepo.save({
            ...orderChild,
            payment_status: order.payment_status,
          })
        }),
      )
    })
  }

  async handleReturnOrderRequest({
    id, ///order id
    return_id, // return id
  }: {
    id: string
    return_id: string
  }) {
    this.logger_.debug('Order return created: ' + id + ', ' + return_id)

    // get order detail
    const order = (await this.orderService.retrieveDetail(id, {
      // @ts-ignore
      select: defaultStoreOrdersFields.concat(['parent_id']),
      relations: defaultStoreOrdersRelations.concat([
        'store',
        'store.owner',
        'store.store_detail',
        'items.line_item_addons',
        'items.line_item_addons.lv1',
        'items.line_item_addons.lv2',
        'items.shipping_method',
      ]),
    })) as Order
    // get return detail
    const ret = await this.returnService.retrieve(return_id, {
      relations: ['items', 'items.reason'],
    })

    order.items = order.items.filter((item) =>
      ret.items.some((item_) => item_.item_id === item.id),
    )

    const reason = ret.items[0].reason.label

    // emit new event, use email sender service to send mail
    await this.eventBusService.emit(
      OrderService.Events.ORDER_RETURN_REQUESTED,
      {
        id: `${id}-${return_id}`,
        email: order.customer.email,
        customer_id: order.customer_id,
        format: 'order-return-request',
        data: {
          order: this.orderService.convertToEmailOrder(order),
          reason,
        },
      },
    )
  }

  async checkDiscountSale(isSale: boolean, item: LineItem): Promise<boolean> {
    const moneyAmountRepo = this.manager.getCustomRepository(
      this.moneyAmountRepo_,
    )
    const today = dayjs()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .utc()
      .format('YYYY-MM-DD')

    const data = await moneyAmountRepo
      .createQueryBuilder('mn')
      .innerJoin(
        'price_list',
        'pl',
        `mn.price_list_id = pl.id AND ((to_char(starts_at, 'YYYY-MM-DD') <= '${today}' AND to_char(ends_at, 'YYYY-MM-DD') >= '${today}') OR (to_char(starts_at, 'YYYY-MM-DD') <= '${today}' and ends_at is null))`,
      )
      .where(`mn.variant_id = :variantId and mn.price_list_id is not null`, {
        variantId: item.variant_id,
      })
      .getCount()

    if ((isSale && data > 0) || data === 0) {
      return true
    }
    return false
  }

  async checkStoreApplyStore(
    item: LineItem,
    discount: Discount,
  ): Promise<boolean> {
    const storeRepo = this.manager.getCustomRepository(this.storeRepo_)
    if (
      discount.store_apply === StoreApplyEnum.ALL ||
      discount.store_apply === StoreApplyEnum.CSV
    ) {
      return true
    }

    if (discount.store_apply === StoreApplyEnum.STORE) {
      const store = await storeRepo.findOne(item.store_id)
      if (store.created_at >= discount.released_at) {
        return true
      }
    }
    return false
  }
}
