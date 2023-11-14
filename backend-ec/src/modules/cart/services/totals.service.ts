/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  DiscountCondition as MedusaDiscountCondition,
  DiscountConditionType,
  DiscountRuleType,
  ITaxCalculationStrategy,
  LineItemTaxLine,
  ShippingMethod,
  ShippingMethodTaxLine,
  TaxCalculationContext,
} from '@medusajs/medusa'
import { CartRepository } from '@medusajs/medusa/dist/repositories/cart'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { ShippingMethodRepository } from '@medusajs/medusa/dist/repositories/shipping-method'
import {
  TaxProviderService,
  TotalsService as MedusaTotalsService,
} from '@medusajs/medusa/dist/services'
import { isOrder } from '@medusajs/medusa/dist/types/orders'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import dayjs from 'dayjs'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, FindManyOptions } from 'typeorm'

import TaxInclusivePricingFeatureFlag from '../../../loaders/tax-inclusive-pricing'
import { DiscountCondition } from '../../discount/entities/discount-condition.entity'
import { DiscountConditionRepository } from '../../discount/repository/discount-condition.repository'
import { DiscountRuleRepository } from '../../discount/repository/discount-rule.repository'
import { Product } from '../../product/entity/product.entity'
import { ProductShippingOptionsRepository } from '../../product/repository/product-shipping-options.repository'
import { Store, StorePlanType } from '../../store/entity/store.entity'
import StoreRepository from '../../store/repository/store.repository'
import { Cart } from '../entity/cart.entity'
import { LineItem } from '../entity/line-item.entity'
import { LineItemAddonsRepository } from '../repository/line-item-addons.repository'
import {
  Discount,
  DiscountType,
  StoreApplyEnum,
} from './../../discount/entities/discount.entity'
import { Order } from './../../order/entity/order.entity'

type ShippingMethodTotals = {
  price: number
  tax_total: number
  total: number
  subtotal: number
  original_total: number
  original_tax_total: number
  tax_lines: ShippingMethodTaxLine[]
}

type InjectedDependencies = {
  taxProviderService: TaxProviderService
  taxCalculationStrategy: ITaxCalculationStrategy
  manager: EntityManager
  featureFlagRouter: FlagRouter
  lineItemAddonsRepository: typeof LineItemAddonsRepository
  shippingMethodRepository: typeof ShippingMethodRepository
  lineItemRepository: typeof LineItemRepository
  cartRepository: typeof CartRepository
  storeRepository: typeof StoreRepository
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  discountConditionRepository: typeof DiscountConditionRepository
  moneyAmountRepository: typeof MoneyAmountRepository
  discountRuleRepository: typeof DiscountRuleRepository
}

type LineItemTotalsOptions = {
  include_tax?: boolean
  use_tax_lines?: boolean
  exclude_gift_cards?: boolean
  calculation_context?: TaxCalculationContext
}

type GetShippingMethodTotalsOptions = {
  include_tax?: boolean
  use_tax_lines?: boolean
  calculation_context?: TaxCalculationContext
  disable_free_shipping?: boolean
}

export type LineItemTotals = {
  unit_price: number
  total_unit_price: number
  quantity: number
  subtotal: number
  tax_total: number
  total: number
  addon_subtotal_price: number
  shipping_total?: number
  original_total: number
  original_tax_total: number
  tax_lines: LineItemTaxLine[]
  discount_total: number
  gift_cover_total: number
}

type GetTotalsOptions = {
  exclude_gift_cards?: boolean
  force_taxes?: boolean
}

@Service({ override: MedusaTotalsService })
export class TotalsService extends MedusaTotalsService {
  static resolutionKey = 'totalsService'

  private readonly manager: EntityManager
  protected lineItemAddonsRepo_: typeof LineItemAddonsRepository
  protected shippingMethodRepo_: typeof ShippingMethodRepository
  protected lineItemRepo_: typeof LineItemRepository
  protected cartRepo_: typeof CartRepository
  protected storeRepo_: typeof StoreRepository
  protected container: InjectedDependencies
  protected productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  protected dcRepo_: typeof DiscountConditionRepository
  protected readonly moneyAmountRepo_: typeof MoneyAmountRepository
  protected readonly discountRuleRepo_: typeof DiscountRuleRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.lineItemRepo_ = container.lineItemRepository
    this.lineItemAddonsRepo_ = container.lineItemAddonsRepository
    this.shippingMethodRepo_ = container.shippingMethodRepository
    this.cartRepo_ = container.cartRepository
    this.storeRepo_ = container.storeRepository
    this.productShippingOptionsRepository =
      container.productShippingOptionsRepository
    this.manager = container.manager
    this.container = container
    this.dcRepo_ = container.discountConditionRepository
    this.moneyAmountRepo_ = container.moneyAmountRepository
    this.discountRuleRepo_ = container.discountRuleRepository
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): TotalsService {
    if (!transactionManager) {
      return this
    }

    const cloned = new TotalsService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async getLineItemAddonPrice(
    lineItem: LineItem,
    tx?: EntityManager,
  ): Promise<number> {
    tx = tx || this.manager
    const lineItemAddonsRepo = tx.getCustomRepository(this.lineItemAddonsRepo_)

    const addons = await lineItemAddonsRepo.find({
      where: { line_item_id: lineItem.id },
    })

    const price = (addons || []).reduce(
      (acc, current) => acc + current.price,
      0,
    )

    return price
  }

  async getLineItemGiftCoverTotal(
    lineItemId: string,
    tx?: EntityManager,
  ): Promise<number> {
    tx = tx || this.manager
    const lineItemRepo = tx.getCustomRepository(this.lineItemRepo_)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lineItem = (await lineItemRepo.findOne(lineItemId, {
      select: ['id', 'metadata'],
    })) as LineItem

    return 0
  }

  async getLineItemTotals(
    lineItem: LineItem,
    cartOrOrder: Cart | Order,
    options: LineItemTotalsOptions = {},
  ): Promise<LineItemTotals> {
    const addonPrice = (await this.getLineItemAddonPrice(lineItem)) || 0
    const giftCoverTotal =
      (await this.getLineItemGiftCoverTotal(lineItem.id)) || 0

    // overide unit_price of line_item
    lineItem.unit_price += addonPrice
    lineItem.total_unit_price = lineItem.unit_price

    const lineItemTotals = await super.getLineItemTotals(
      lineItem,
      cartOrOrder,
      options,
    )
    // return to old val
    lineItem.unit_price -= addonPrice

    const newFee = giftCoverTotal

    lineItemTotals.total += newFee
    lineItemTotals.original_total += newFee

    const result: LineItemTotals = {
      ...lineItemTotals,
      addon_subtotal_price: addonPrice,
      gift_cover_total: giftCoverTotal,
      unit_price: lineItem.unit_price,
      total_unit_price: lineItem.total_unit_price,
    }

    return result
  }

  async getRawShippingMethodTotals(
    shippingMethod: ShippingMethod,
    cartOrOrder: Cart | Order,
    opts: GetShippingMethodTotalsOptions = {},
  ): Promise<ShippingMethodTotals> {
    const calculationContext =
      opts.calculation_context ||
      (await this.getCalculationContext(cartOrOrder, {
        exclude_shipping: true,
      }))
    calculationContext.shipping_methods = [shippingMethod]

    const totals = {
      price: shippingMethod.price,
      original_total: shippingMethod.price,
      total: shippingMethod.price,
      subtotal: shippingMethod.price,
      original_tax_total: 0,
      tax_total: 0,
      tax_lines: shippingMethod.tax_lines || [],
    }

    if (opts.include_tax) {
      if (isOrder(cartOrOrder) && cartOrOrder.tax_rate != null) {
        totals.original_tax_total = Math.round(
          totals.price * (cartOrOrder.tax_rate / 100),
        )
        totals.tax_total = Math.round(
          totals.price * (cartOrOrder.tax_rate / 100),
        )
      } else if (totals.tax_lines.length === 0) {
        const orderLines = await this.taxProviderService_
          .withTransaction(this.manager_)
          .getTaxLines(cartOrOrder.items, calculationContext)

        totals.tax_lines = orderLines.filter((ol) => {
          if ('shipping_method_id' in ol) {
            return ol.shipping_method_id === shippingMethod.id
          }
          return false
        }) as ShippingMethodTaxLine[]

        if (totals.tax_lines.length === 0 && isOrder(cartOrOrder)) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            'Tax Lines must be joined on shipping method to calculate taxes',
          )
        }
      }

      if (totals.tax_lines.length > 0) {
        const includesTax =
          this.featureFlagRouter_.isFeatureEnabled(
            TaxInclusivePricingFeatureFlag.key,
          ) && shippingMethod.includes_tax

        totals.original_tax_total =
          await this.taxCalculationStrategy_.calculate(
            [],
            totals.tax_lines,
            calculationContext,
          )
        totals.tax_total = totals.original_tax_total

        if (includesTax) {
          totals.subtotal -= totals.tax_total
        } else {
          totals.original_total += totals.original_tax_total
          totals.total += totals.tax_total
        }
      }
    }

    const hasFreeShipping = cartOrOrder.discounts?.some(
      (d) => d.rule.type === DiscountRuleType.FREE_SHIPPING,
    )

    const shippingMethods = await this.checkFreeShippingMethod(cartOrOrder)

    if (
      hasFreeShipping &&
      shippingMethods.some((e) => e === shippingMethod.id)
    ) {
      totals.total = 0
      totals.subtotal = 0
      totals.tax_total = 0
    }

    return totals
  }

  async checkFreeShippingMethod(cartOrOrder: Cart | Order): Promise<string[]> {
    const disConditionRepo_ = this.manager.getCustomRepository(this.dcRepo_)
    const discount = cartOrOrder.discounts?.find(
      (d) => d.rule.type === DiscountRuleType.FREE_SHIPPING,
    )
    const smt = []

    for (const item of cartOrOrder.items) {
      const isStore = await disConditionRepo_.canApplyForStore(
        discount?.rule_id,
        (item as LineItem).store_id,
      )

      const isType = await disConditionRepo_.canApplyForProductTypes(
        discount?.rule_id,
        item.variant.product_id,
      )

      const isProd = await disConditionRepo_.canApplyForProducts(
        discount?.rule_id,
        item.variant.product_id,
      )

      if (isStore && isType && isProd) {
        smt.push((item as LineItem).shipping_method_id)
      }
    }
    return smt
  }

  // overide to calculate free shipping for each store
  async getShippingMethodTotals(
    shippingMethod: ShippingMethod,
    cartOrOrder: Cart | Order,
    opts: GetShippingMethodTotalsOptions = {},
  ): Promise<ShippingMethodTotals> {
    const rawShippingTotals = await this.getRawShippingMethodTotals(
      shippingMethod,
      cartOrOrder,
      opts,
    )

    if (opts.disable_free_shipping) return rawShippingTotals

    const lineItemRepo = this.manager.getCustomRepository(this.lineItemRepo_)

    const lineItem = (await lineItemRepo.findOne(
      // @ts-ignore
      { shipping_method_id: shippingMethod.id },
      {
        select: ['id', 'store_id'],
        relations: ['store', 'variant', 'variant.product'],
      },
    )) as LineItem

    if (!lineItem) return rawShippingTotals

    // if product is free shipping return 0
    // @ts-ignore
    if (lineItem.variant?.product?.is_free_shipping) {
      rawShippingTotals.subtotal = 0
      rawShippingTotals.total = 0
      return rawShippingTotals
    }

    const store = lineItem.store

    // this store does not set free shipping
    if (store.free_ship_amount === 0) return rawShippingTotals

    const storeTotal = cartOrOrder.items.reduce(
      (acc: number, item: LineItem) => {
        if (item.store_id === store.id) return acc + (item.subtotal || 0)

        return acc
      },
      0,
    )

    // if total price of that store greater or equal to free shipping amount => free shipping
    if (storeTotal >= store.free_ship_amount) {
      rawShippingTotals.subtotal = 0
      rawShippingTotals.total = 0
    }

    return rawShippingTotals
  }

  async getShippingTotal(cartOrOrder: Cart | Order): Promise<number> {
    if (cartOrOrder.shipping_total > 0) return cartOrOrder.shipping_total
    cartOrOrder.shipping_methods = await Promise.all(
      cartOrOrder.shipping_methods.map(async (sm) => {
        const totals = await this.getShippingMethodTotals(sm, cartOrOrder, {
          include_tax: true,
        })

        return Object.assign(sm, _.omit(totals, ['tax_lines']))
      }),
    )

    await this.decorateBulkShippingPrice(cartOrOrder)

    return cartOrOrder.items.reduce(
      (acc, item: LineItem) => item.shipping_total + acc,
      0,
    )
  }

  async decorateBulkShippingPrice_old(cartOrOrder: Cart | Order) {
    const productShippingOptionRepo = this.manager.getCustomRepository(
      this.productShippingOptionsRepository,
    )

    const groupItems: any = {}

    // group items in cart by store id
    for (const item of cartOrOrder.items as LineItem[]) {
      if (!groupItems.hasOwnProperty(item.store_id)) {
        groupItems[item.store_id] = [item]
      } else {
        groupItems[item.store_id].push(item)
      }
    }

    // find items that have bulk price setting
    for (const storeId in groupItems) {
      let bulkedItems: LineItem[] = []
      const notBulkedItems: LineItem[] = []

      let storeItems: LineItem[] = groupItems[storeId]
      storeItems = await Promise.all(
        storeItems.map(async (item: LineItem) => {
          const method = cartOrOrder.shipping_methods.find(
            (sm) => sm.id === item.shipping_method_id,
          )

          // this line item already has shipping method => calculate line item shipping price
          if (method) {
            if (method.subtotal === 0) {
              // free shipping
              return Object.assign(item, { shipping_total: 0 })
            }

            // get the product shipping option => get the bulk price
            const productShippingOption =
              await productShippingOptionRepo.findOne({
                where: {
                  product_id: item.variant.product_id,
                  shipping_option_id: method.shipping_option_id,
                },
              })

            const original_shipping_total = method.subtotal
            const bulk_shipping_total = productShippingOption?.bulk_added_price

            const newTotals = {
              bulk_shipping_total,
              original_shipping_total,
            }

            const newItem = Object.assign(item, newTotals)

            // categorize bulk and not bulk line item
            if (_.isNil(bulk_shipping_total)) {
              notBulkedItems.push(newItem)
            } else {
              bulkedItems.push(newItem)
            }

            return newItem
          }
          return item
        }),
      )

      // sort bulked price items by shipping total or bulk shipping total
      bulkedItems.sort((a, b) => {
        if (a.original_shipping_total !== b.original_shipping_total) {
          return b.original_shipping_total - a.original_shipping_total
        } else {
          return a.bulk_shipping_total - b.bulk_shipping_total
        }
      })

      // re-calculate shipping price (including bulk price)
      bulkedItems = bulkedItems.map((item, index) => {
        let shippingTotal
        if (index === 0) {
          shippingTotal =
            item.original_shipping_total +
            item.bulk_shipping_total * (item.quantity - 1)
        } else {
          shippingTotal = item.bulk_shipping_total * item.quantity
        }
        item.shipping_total = shippingTotal
        item.total += shippingTotal
        item.original_total += shippingTotal

        return item
      })

      // not bulked items => shipping_total = originial_shipping_total * quantity
      storeItems = storeItems.map((item: LineItem) => {
        const bulkedItem = bulkedItems.find((i) => i.id === item.id)
        const notBulkedItem = notBulkedItems.find((i) => i.id === item.id)
        if (bulkedItem) {
          return bulkedItem
        } else if (notBulkedItem) {
          const shippingTotal = item.original_shipping_total * item.quantity
          item.shipping_total = shippingTotal
          item.total += shippingTotal
          item.original_total += shippingTotal
          return item
        } else {
          return item
        }
      })

      cartOrOrder.items = cartOrOrder.items.map((item: LineItem) => {
        const item_ = storeItems.find((i) => i.id === item.id)
        return item_ ?? item
      })
    }

    return cartOrOrder
  }

  async decorateBulkShippingPrice(cartOrOrder: Cart | Order) {
    const productShippingOptionRepo = this.manager.getCustomRepository(
      this.productShippingOptionsRepository,
    )

    const groupItems: any = {}
    const groupStores: { [key: string]: Store } = {}

    // group items in cart by store id
    for (const item of cartOrOrder.items as LineItem[]) {
      if (!groupItems.hasOwnProperty(item.store_id)) {
        groupItems[item.store_id] = [item]
        groupStores[item.store_id] = item.store
      } else {
        groupItems[item.store_id].push(item)
      }
    }

    // find items that have bulk price setting
    for (const storeId in groupItems) {
      let bulkedItems: LineItem[] = []
      const notBulkedItems: LineItem[] = []

      let storeItems: LineItem[] = groupItems[storeId]
      const store = groupStores[storeId]

      // for premium stores
      // apply new strategy to calculate shipping price for items belong to premium store
      if (store.plan_type === StorePlanType.PRIME) {
        // sort by created_at asc
        storeItems.sort((a, b) =>
          new Date(a.created_at) > new Date(b.created_at) ? 1 : -1,
        )

        // only calc item that is first added to cart
        storeItems = storeItems.map((item, index) => {
          if (index === 0) {
            const method = cartOrOrder.shipping_methods.find(
              (sm) => sm.id === item.shipping_method_id,
            )
            if (method) {
              item.shipping_total = method.subtotal
            }
          } else {
            item.shipping_total = 0
          }

          return item
        })

        cartOrOrder.items = cartOrOrder.items.map((item: LineItem) => {
          const item_ = storeItems.find((i) => i.id === item.id)
          return item_ ?? item
        })

        continue
      }

      // for standard stores
      storeItems = await Promise.all(
        storeItems.map(async (item: LineItem) => {
          const method = cartOrOrder.shipping_methods.find(
            (sm) => sm.id === item.shipping_method_id,
          )

          // this line item already has shipping method => calculate line item shipping price
          if (method) {
            if (method.subtotal === 0) {
              // free shipping
              return Object.assign(item, { shipping_total: 0 })
            }

            // get the product shipping option => get the bulk price
            const productShippingOption =
              await productShippingOptionRepo.findOne({
                where: {
                  product_id: item.variant.product_id,
                  shipping_option_id: method.shipping_option_id,
                },
              })

            const original_shipping_total = method.subtotal
            const bulk_shipping_total = productShippingOption?.bulk_added_price

            const newTotals = {
              bulk_shipping_total,
              original_shipping_total,
            }

            const newItem = Object.assign(item, newTotals)

            // categorize bulk and not bulk line item
            if (_.isNil(bulk_shipping_total)) {
              notBulkedItems.push(newItem)
            } else {
              bulkedItems.push(newItem)
            }

            return newItem
          }
          return item
        }),
      )

      // sort bulked price items by shipping total or bulk shipping total
      bulkedItems.sort((a, b) => {
        if (a.original_shipping_total !== b.original_shipping_total) {
          return b.original_shipping_total - a.original_shipping_total
        } else {
          return a.bulk_shipping_total - b.bulk_shipping_total
        }
      })

      // re-calculate shipping price (including bulk price)
      bulkedItems = bulkedItems.map((item, index) => {
        let shippingTotal
        if (index === 0) {
          shippingTotal =
            item.original_shipping_total +
            item.bulk_shipping_total * (item.quantity - 1)
        } else {
          shippingTotal = item.bulk_shipping_total * item.quantity
        }
        item.shipping_total = shippingTotal
        item.total += shippingTotal
        item.original_total += shippingTotal

        return item
      })

      // not bulked items => shipping_total = originial_shipping_total * quantity
      storeItems = storeItems.map((item: LineItem) => {
        const bulkedItem = bulkedItems.find((i) => i.id === item.id)
        const notBulkedItem = notBulkedItems.find((i) => i.id === item.id)
        if (bulkedItem) {
          return bulkedItem
        } else if (notBulkedItem) {
          const shippingTotal = item.original_shipping_total * item.quantity
          item.shipping_total = shippingTotal
          item.total += shippingTotal
          item.original_total += shippingTotal
          return item
        } else {
          return item
        }
      })

      cartOrOrder.items = cartOrOrder.items.map((item: LineItem) => {
        const item_ = storeItems.find((i) => i.id === item.id)
        return item_ ?? item
      })
    }

    return cartOrOrder
  }

  async getGiftCoverTotal(cartOrOrder: Cart | Order): Promise<number> {
    return (
      cartOrOrder.items?.reduce(
        (acc, item: LineItem) => item.gift_cover_total + acc,
        0,
      ) || 0
    )
  }

  async getAddonTotal(cartOrOrder: Cart | Order): Promise<number> {
    let total = 0

    if (cartOrOrder.items) {
      for (const item of cartOrOrder.items) {
        total += await this.getLineItemAddonPrice(item as LineItem)
      }
    }

    return total
  }

  async getTotal(
    cartOrOrder: Cart | Order,
    options: GetTotalsOptions = {},
  ): Promise<number> {
    // const discountRuleRepo = this.manager_.getCustomRepository(
    //   this.discountRuleRepo_,
    // )
    const giftCoverTotal = await this.getGiftCoverTotal(cartOrOrder)
    const subtotal = await this.getSubtotal(cartOrOrder)
    const taxTotal =
      (await this.getTaxTotal(cartOrOrder, options.force_taxes)) || 0
    const discountTotal = await this.getDiscountTotal(cartOrOrder)
    const giftCardTotal = options.exclude_gift_cards
      ? { total: 0 }
      : await this.getGiftCardTotal(cartOrOrder)
    const shippingTotal = await this.getShippingTotal(cartOrOrder)

    return (
      subtotal +
      taxTotal +
      shippingTotal +
      giftCoverTotal -
      discountTotal -
      giftCardTotal.total
    )
  }

  async getDiscountTotal(cartOrOrder: Cart | Order): Promise<number> {
    const dcRepo = this.manager.getCustomRepository(this.dcRepo_)
    const newCartOrOrder = _.cloneDeep(cartOrOrder)
    if (newCartOrOrder.discount_total > 0) return newCartOrOrder.discount_total
    const subtotal = await this.getSubtotal(newCartOrOrder, {
      excludeNonDiscounts: true,
    })

    // TODO: finding bug why cart.items.subtotal not exist
    if (!newCartOrOrder.subtotal) {
      newCartOrOrder.items = (await Promise.all(
        newCartOrOrder.items.map(async (item: LineItem) => {
          const itemTotals = await this.getLineItemTotals(item, newCartOrOrder)

          return Object.assign(item, itemTotals)
        }),
      )) as LineItem[]
      newCartOrOrder.subtotal = newCartOrOrder.items.reduce(
        (acc, item) => acc + item.subtotal,
        0,
      )
    }

    // we only support having free shipping and one other discount, so first
    // find the discount, which is not free shipping.
    const discount = newCartOrOrder.discounts?.find(
      ({ rule }) => rule.type !== DiscountRuleType.FREE_SHIPPING,
    )

    if (!discount) {
      return 0
    }

    // let discountTotal = this.getLineItemAdjustmentsTotal(cartOrOrder)
    let discountTotal = 0
    let pointTotal = 0

    // re-calculate discount total with extra discount: coupon, point, promo code
    newCartOrOrder.discounts = newCartOrOrder.discounts.filter(
      (discount: Discount) => !!discount.type,
    )
    if (cartOrOrder.object === 'order') {
      await Promise.all(
        cartOrOrder.discounts.map((e) => {
          if ((e as Discount).type === DiscountType.POINT) {
            pointTotal += e.rule.value
          } else {
            discountTotal += e.rule.value
          }
        }),
      )
    } else {
      await Promise.all(
        newCartOrOrder.discounts.map(async (discount: Discount) => {
          let addon = 0
          switch (discount.type) {
            case DiscountType.PROMO_CODE:
              const qr: FindManyOptions<MedusaDiscountCondition> = buildQuery(
                { discount_rule_id: discount.rule_id },
                {
                  relations: [
                    'products',
                    'product_types',
                    'store_groups',
                    'store_groups.stores',
                  ],
                },
              )
              const tmp = await dcRepo.find(qr)
              const prds = tmp.find(
                (e) => e.type === DiscountConditionType.PRODUCTS,
              )

              const tps = tmp.find(
                (e) => e.type === DiscountConditionType.PRODUCT_TYPES,
              )

              const stg = tmp.find(
                (e) => (e.type as any) === 'store_groups',
              ) as DiscountCondition

              for (const item of newCartOrOrder.items) {
                const isSale = await this.checkDiscountSale(
                  discount.is_sale,
                  item as LineItem,
                )
                const isApplyStore = await this.checkStoreApplyStore(
                  item as LineItem,
                  discount,
                )

                let checkTypes = false
                if (tps) {
                  const isType = this.checkData(
                    tps.product_types as any[],
                    item.variant.product.type_id,
                  )

                  const isTypelv1 = this.checkData(
                    tps.product_types as any[],
                    (item.variant.product as Product).type_lv1_id,
                  )

                  const isTypelv2 = this.checkData(
                    tps.product_types as any[],
                    (item.variant.product as Product).type_lv2_id,
                  )

                  checkTypes = isType || isTypelv1 || isTypelv2
                }

                if (!prds && !tps && !stg && isSale && isApplyStore) {
                  if (discount.rule.type === DiscountRuleType.FIXED) {
                    addon += discount.rule.value
                  }
                  if (discount.rule.type === DiscountRuleType.PERCENTAGE) {
                    addon += Math.floor(
                      (item.subtotal * discount.rule.value) / 100,
                    )
                  }
                }
                if (
                  isSale &&
                  isApplyStore &&
                  ((prds &&
                    this.checkData(
                      prds.products as any[],
                      item.variant.product_id,
                    )) ||
                    (tps && checkTypes) ||
                    (!prds && !tps) ||
                    (discount.store_id &&
                      (item as LineItem).store_id === discount.store_id) ||
                    !discount.store_id)
                ) {
                  if (stg) {
                    for (const e of stg.store_groups) {
                      if (
                        this.checkData(e.stores, (item as LineItem).store_id)
                      ) {
                        if (discount.rule.type === DiscountRuleType.FIXED) {
                          addon += discount.rule.value
                        }
                        if (
                          discount.rule.type === DiscountRuleType.PERCENTAGE
                        ) {
                          addon += Math.floor(
                            (item.subtotal * discount.rule.value) / 100,
                          )
                        }
                      }
                    }
                  }
                  if (
                    ((prds &&
                      this.checkData(
                        prds.products as any[],
                        item.variant.product_id,
                      )) ||
                      (tps && checkTypes)) &&
                    !stg
                  ) {
                    if (discount.rule.type === DiscountRuleType.FIXED) {
                      addon += discount.rule.value
                    }
                    if (discount.rule.type === DiscountRuleType.PERCENTAGE) {
                      addon += Math.floor(
                        (item.subtotal * discount.rule.value) / 100,
                      )
                    }
                  }
                }
              }
              break
            case DiscountType.COUPON:
              const query: FindManyOptions<MedusaDiscountCondition> =
                buildQuery(
                  { discount_rule_id: discount.rule_id },
                  {
                    relations: [
                      'products',
                      'product_types',
                      'store_groups',
                      'store_groups.stores',
                    ],
                  },
                )
              const data = await dcRepo.find(query)
              const prods = data.find(
                (e) => e.type === DiscountConditionType.PRODUCTS,
              )

              const types = data.find(
                (e) => e.type === DiscountConditionType.PRODUCT_TYPES,
              )

              const sg = data.find(
                (e) => (e.type as any) === 'store_groups',
              ) as DiscountCondition

              let total = 0
              if (discount.rule.type === DiscountRuleType.FIXED) {
                total = discount.rule.value
              }
              for (const item of newCartOrOrder.items) {
                const isSale = await this.checkDiscountSale(
                  discount.is_sale,
                  item as LineItem,
                )
                const isTargetStore = await this.checkStoreApplyStore(
                  item as LineItem,
                  discount,
                )

                let checkTypes = false
                if (types) {
                  const isType = this.checkData(
                    types.product_types as any[],
                    item.variant.product.type_id,
                  )

                  const isTypelv1 = this.checkData(
                    types.product_types as any[],
                    (item.variant.product as Product).type_lv1_id,
                  )

                  const isTypelv2 = this.checkData(
                    types.product_types as any[],
                    (item.variant.product as Product).type_lv2_id,
                  )
                  checkTypes = isType || isTypelv1 || isTypelv2
                }

                if (!prods && !types && !sg && isSale && isTargetStore) {
                  if (discount.rule.type === DiscountRuleType.FIXED) {
                    if (item.subtotal > total) {
                      addon += total
                    } else {
                      addon += item.subtotal
                      total -= item.subtotal
                    }
                  }

                  if (discount.rule.type === DiscountRuleType.PERCENTAGE) {
                    addon += Math.floor(
                      (item.subtotal * discount.rule.value) / 100,
                    )
                  }
                }
                if (
                  isSale &&
                  isTargetStore &&
                  ((prods &&
                    this.checkData(
                      prods.products as any[],
                      item.variant.product_id,
                    )) ||
                    (types && checkTypes) ||
                    (!prods && !types) ||
                    (discount.store_id &&
                      (item as LineItem).store_id === discount.store_id) ||
                    !discount.store_id)
                ) {
                  if (sg) {
                    for (const e of sg.store_groups) {
                      if (
                        this.checkData(e.stores, (item as LineItem).store_id)
                      ) {
                        if (discount.rule.type === DiscountRuleType.FIXED) {
                          if (item.subtotal > total) {
                            addon += total
                          } else {
                            addon += item.subtotal
                            total -= item.subtotal
                          }
                        }
                        if (
                          discount.rule.type === DiscountRuleType.PERCENTAGE
                        ) {
                          addon += Math.floor(
                            (item.subtotal * discount.rule.value) / 100,
                          )
                        }
                      }
                    }
                  }
                  if (
                    ((prods &&
                      this.checkData(
                        prods.products as any[],
                        item.variant.product_id,
                      )) ||
                      (types && checkTypes)) &&
                    !sg
                  ) {
                    if (discount.rule.type === DiscountRuleType.FIXED) {
                      if (item.subtotal > total) {
                        addon += discount.rule.value
                      } else {
                        addon += item.subtotal
                        total -= item.subtotal
                      }
                    }
                    if (discount.rule.type === DiscountRuleType.PERCENTAGE) {
                      addon += Math.floor(
                        (item.subtotal * discount.rule.value) / 100,
                      )
                    }
                  }
                }
              }
              break
            default:
              break
          }

          discountTotal += addon
        }),
      )
    }

    if (subtotal < 0) {
      return this.rounded(Math.max(subtotal, discountTotal)) + pointTotal
    }

    return this.rounded(Math.min(subtotal, discountTotal)) + pointTotal
  }

  checkData(data: any[], key: string) {
    if (data.some((e) => e.id === key)) {
      return true
    }
    return false
  }

  async checkStoreApplyStore(
    item: LineItem,
    discount: Discount,
  ): Promise<boolean> {
    const storeRepo = this.manager_.getCustomRepository(this.storeRepo_)
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

  async checkDiscountSale(isSale: boolean, item: LineItem): Promise<boolean> {
    const moneyAmountRepo = this.manager_.getCustomRepository(
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
}
