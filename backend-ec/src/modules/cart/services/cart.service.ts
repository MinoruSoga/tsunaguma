/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
  DiscountRuleType,
  IPriceSelectionStrategy,
  PaymentSession,
  ProductStatus,
} from '@medusajs/medusa'
import { AddressRepository } from '@medusajs/medusa/dist/repositories/address'
import { CartRepository } from '@medusajs/medusa/dist/repositories/cart'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { PaymentSessionRepository } from '@medusajs/medusa/dist/repositories/payment-session'
import { PriceListRepository } from '@medusajs/medusa/dist/repositories/price-list'
import { ProductOptionValueRepository } from '@medusajs/medusa/dist/repositories/product-option-value'
import { ShippingMethodRepository } from '@medusajs/medusa/dist/repositories/shipping-method'
import {
  CartService as MedusaCartService,
  CustomerService,
  CustomShippingOptionService,
  DiscountService,
  EventBusService,
  GiftCardService,
  InventoryService,
  LineItemAdjustmentService,
  PaymentProviderService,
  PricingService,
  ProductService,
  ProductVariantService,
  RegionService,
  SalesChannelService,
  ShippingOptionService,
  TaxProviderService,
} from '@medusajs/medusa/dist/services'
import { CartUpdateProps } from '@medusajs/medusa/dist/types/cart'
import {
  AddressPayload,
  FindConfig,
  Selector,
} from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery, isDefined } from '@medusajs/medusa/dist/utils'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import dayjs from 'dayjs'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, In, IsNull, Not } from 'typeorm'
import { v4 as uuid } from 'uuid'

import {
  EAST_ASIA_REGION_ID,
  GMO_CARD_ID,
  JAPANESE_COUNTRY_ISO2,
  JAPANESE_CURRENCY_CODE,
} from '../../../helpers/constant'
import { convertPointToMoney } from '../../../helpers/point'
import {
  Discount,
  DiscountStatus,
  DiscountType,
  IssuanceTimingEnum,
  StoreApplyEnum,
} from '../../discount/entities/discount.entity'
import { DiscountRepository } from '../../discount/repository/discount.repository'
import { DiscountConditionRepository } from '../../discount/repository/discount-condition.repository'
import { DiscountRuleRepository } from '../../discount/repository/discount-rule.repository'
import { UserCouponRepository } from '../../discount/repository/user-coupon.repository'
import { UserDiscountRepository } from '../../discount/repository/user-discount.repository'
import { ProductFavoriteRepository } from '../../favorite/repository/product-favorite.repository'
import { StoreFavoriteRepository } from '../../favorite/repository/store-favorite.repository'
import { OrderRepository } from '../../order/repository/order.repository'
import { PointService } from '../../point/services/point.service'
import { ProductReviewsRepository } from '../../product/repository/product-reviews.repository'
import { ProductShippingOptionsRepository } from '../../product/repository/product-shipping-options.repository'
import { StoreStatus } from '../../store/entity/store.entity'
import StoreRepository from '../../store/repository/store.repository'
import { StoreDetailRepository } from '../../store/repository/store-detail.repository'
import StoreService from '../../store/services/store.service'
import { Address } from '../../user/entity/address.entity'
import { CustomerRepository } from '../../user/repository/customer.repository'
import UserRepository from '../../user/user.repository'
import { LineItemShippingMethodItem } from '../controllers/add-cart-shipping-methods.admin.controller'
import { GmoCardAuthenType } from '../controllers/authorize-cart-payment.admin.controller'
import { StorePostCartLineItemAddon } from '../controllers/create-line-item.store.controller'
import { UpsertCartDiscountReq } from '../controllers/upsert-cart-discount.admin.controller'
import { Cart } from '../entity/cart.entity'
import { LineItem } from '../entity/line-item.entity'
import { LineItemAddonsRepository } from '../repository/line-item-addons.repository'
import { FulfillmentProviderService } from './../../shipping/services/fulfillment-provider.service'
import { LineItemService } from './line-item.service'
import { LineItemTotals, TotalsService } from './totals.service'

type InjectedDependencies = {
  manager: EntityManager
  cartRepository: typeof CartRepository
  shippingMethodRepository: typeof ShippingMethodRepository
  addressRepository: typeof AddressRepository
  paymentSessionRepository: typeof PaymentSessionRepository
  lineItemRepository: typeof LineItemRepository
  lineItemAddonsRepository: typeof LineItemAddonsRepository
  eventBusService: EventBusService
  salesChannelService: SalesChannelService
  taxProviderService: TaxProviderService
  paymentProviderService: PaymentProviderService
  productService: ProductService
  storeService: StoreService
  featureFlagRouter: FlagRouter
  productVariantService: ProductVariantService
  regionService: RegionService
  lineItemService: LineItemService
  shippingOptionService: ShippingOptionService
  customerService: CustomerService
  discountService: DiscountService
  giftCardService: GiftCardService
  totalsService: TotalsService
  inventoryService: InventoryService
  customShippingOptionService: CustomShippingOptionService
  lineItemAdjustmentService: LineItemAdjustmentService
  priceSelectionStrategy: IPriceSelectionStrategy
  logger: Logger
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  pointService: PointService
  fulfillmentProviderService: FulfillmentProviderService
  productOptionValueRepository: typeof ProductOptionValueRepository
  discountRepository: typeof DiscountRepository
  discountConditionRepository: typeof DiscountConditionRepository
  userCouponRepository: typeof UserCouponRepository
  userDiscountRepository: typeof UserDiscountRepository
  moneyAmountRepository: typeof MoneyAmountRepository
  priceListRepository: typeof PriceListRepository
  storeDetailRepository: typeof StoreDetailRepository
  userRepository: typeof UserRepository
  productReviewsRepository: typeof ProductReviewsRepository
  productFavoriteRepository: typeof ProductFavoriteRepository
  storeFavoriteRepository: typeof StoreFavoriteRepository
  orderRepository: typeof OrderRepository
  storeRepository: typeof StoreRepository
  discountRuleRepository: typeof DiscountRuleRepository
  customerRepository: typeof CustomerRepository
  pricingService: PricingService
}

type TotalsConfig = {
  force_taxes?: boolean
}

type AuthorizeCartPaymentInput = {
  token?: string
  memberId?: string
  cardSeq?: string
  type: GmoCardAuthenType
}

type CartUpdateInput = CartUpdateProps & {
  is_own_shipping?: boolean
  used_point?: number
}

@Service({ override: MedusaCartService })
export class CartService extends MedusaCartService {
  static resolutionKey = 'cartService'
  private logger_: Logger

  private container: InjectedDependencies
  protected totalService: TotalsService
  protected storeService: StoreService
  protected pointService: PointService
  protected fulfillmentProviderService: FulfillmentProviderService
  protected productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  protected lineItemAddonsRepo: typeof LineItemAddonsRepository
  private readonly productOptionValueRepo: typeof ProductOptionValueRepository
  protected readonly discountRepo_: typeof DiscountRepository
  protected readonly discConditionRepo_: typeof DiscountConditionRepository
  protected readonly urCouponRepo_: typeof UserCouponRepository
  protected readonly userDiscountRepo_: typeof UserDiscountRepository
  protected readonly moneyAmountRepo_: typeof MoneyAmountRepository
  protected readonly storeDetailRepo_: typeof StoreDetailRepository
  protected readonly userRepo_: typeof UserRepository
  protected readonly reviewsRepo: typeof ProductReviewsRepository
  protected readonly favoriteRepo: typeof ProductFavoriteRepository
  protected readonly storeFavoriteRepo: typeof StoreFavoriteRepository
  protected readonly orderRepo: typeof OrderRepository
  protected readonly storeRepo_: typeof StoreRepository
  protected readonly discountRuleRepo_: typeof DiscountRuleRepository
  protected readonly pricingService: PricingService
  protected readonly customerRepository_: typeof CustomerRepository

  private manager: EntityManager

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): CartService {
    if (!transactionManager) {
      return this
    }

    const cloned = new CartService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.manager = transactionManager

    return cloned
  }

  constructor(container: InjectedDependencies) {
    // @ts-ignore
    super(container)

    this.container = container
    this.logger_ = container.logger
    this.manager = container.manager
    this.storeService = container.storeService
    this.pointService = container.pointService
    this.fulfillmentProviderService = container.fulfillmentProviderService
    this.productShippingOptionsRepository =
      container.productShippingOptionsRepository
    this.totalService = container.totalsService
    this.lineItemAddonsRepo = container.lineItemAddonsRepository
    this.productOptionValueRepo = container.productOptionValueRepository
    this.discountRepo_ = container.discountRepository
    this.discConditionRepo_ = container.discountConditionRepository
    this.urCouponRepo_ = container.userCouponRepository
    this.userDiscountRepo_ = container.userDiscountRepository
    this.moneyAmountRepo_ = container.moneyAmountRepository
    this.userRepo_ = container.userRepository
    this.reviewsRepo = container.productReviewsRepository
    this.favoriteRepo = container.productFavoriteRepository
    this.storeFavoriteRepo = container.storeFavoriteRepository
    this.orderRepo = container.orderRepository
    this.storeDetailRepo_ = container.storeDetailRepository
    this.storeRepo_ = container.storeRepository
    this.discountRuleRepo_ = container.discountRuleRepository
    this.pricingService = container.pricingService
    this.customerRepository_ = container.customerRepository
  }

  async retrieveWithTotals(
    cartId: string,
    options: FindConfig<Cart> = {},
    totalsConfig: TotalsConfig = {},
  ): Promise<Cart> {
    if (options.relations) {
      // add addons relation to when get cart
      options.relations.push(
        'items.line_item_addons',
        'items.line_item_addons.lv1',
        'items.line_item_addons.lv2',
      )
    }

    const productOptionValueRepo = this.manager.getCustomRepository(
      this.productOptionValueRepo,
    )

    // @ts-ignore
    const data = await super.retrieveWithTotals(cartId, options, totalsConfig)

    data.items = await Promise.all(
      data.items.map(async (item: LineItem) => {
        if (!item.variant) return item

        const options = await productOptionValueRepo.find({
          where: { variant_id: item.variant_id },
        })

        item.variant.options = options || []
        return item
      }),
    )

    // sort by created_at asc
    data.items?.sort((a, b) =>
      new Date(a.created_at) > new Date(b.created_at) ? 1 : -1,
    )

    return data as Cart
  }

  async retriveCartWithCustomer(cartId: string, customerId: string) {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const cartRepo = transactionManager.getCustomRepository(
          this.cartRepository_,
        )

        return await cartRepo.findOne({
          id: cartId,
          customer_id: customerId,
        })
      },
    )
  }

  // insert or update line item shipping method
  async upsertLineItemShippingMethods(
    cartId: string,
    items: LineItemShippingMethodItem[],
  ) {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const cart = await this.retrieve(cartId, {
          select: ['subtotal', 'total'],
          relations: [
            'shipping_methods',
            'discounts',
            'discounts.rule',
            'shipping_methods.shipping_option',
            'items',
            'items.variant',
            'payment_sessions',
            'items.variant.product',
          ],
        })

        const lineItemRepo_ = transactionManager.getCustomRepository(
          this.lineItemRepository_,
        )
        const shippingMethodRepo_ = transactionManager.getCustomRepository(
          this.shippingMethodRepository_,
        )

        await Promise.all(
          items.map(async (item) => {
            const line_item = (await lineItemRepo_.findOne({
              where: { cart_id: cartId, id: item.line_item_id },
              relations: ['shipping_method'],
            })) as LineItem
            if (!line_item) {
              throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Line item with id ${item.line_item_id} not found`,
              )
            }

            // if shipping_method is the same => just return
            if (
              line_item.shipping_method?.shipping_option_id === item.option_id
            ) {
              return line_item
            }

            // if this line_item already has a shipping method => remove that shipping method
            if (line_item.shipping_method_id) {
              await shippingMethodRepo_.delete({
                id: line_item.shipping_method_id,
              })

              // delete old shipping method
              delete line_item.shipping_method
            }

            // create a new shipping method for that line_item
            const newSP = await this.shippingOptionService_
              .withTransaction(transactionManager)
              .createShippingMethod(item.option_id, item.data, {
                cart,
              })

            const toUpdate = {
              ...line_item,
              shipping_method_id: newSP.id,
            } as LineItem

            return lineItemRepo_.save(toUpdate)
          }),
        )

        const updatedCart = await this.retrieve(cartId, {
          relations: [
            'discounts',
            'discounts.rule',
            'shipping_methods',
            'items',
          ],
        })

        // if cart has freeshipping, adjust price
        if (
          updatedCart.discounts.some(
            ({ rule }) => rule.type === DiscountRuleType.FREE_SHIPPING,
          )
        ) {
          await this.adjustFreeShipping_(updatedCart as Cart, true)
        }

        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(CartService.Events.UPDATED, updatedCart)
      },
    )
  }

  // fix bug add a new line item when need update (when have the same variant id)
  async addLineItem_old(
    cartId: string,
    lineItem: LineItem,
    config = { validateSalesChannels: true },
  ): Promise<Cart> {
    const lineItemRepo = this.manager.getCustomRepository(
      this.lineItemRepository_,
    )

    const isExist = await lineItemRepo.findOne(
      { cart_id: cartId, variant_id: lineItem.variant_id },
      { select: ['id', 'quantity'] },
    )
    if (isExist) {
      const dataUpdate: any = {
        ...lineItem,
        quantity: lineItem.quantity
          ? lineItem.quantity + isExist.quantity
          : isExist.quantity,
      }
      return (await super.updateLineItem(
        cartId,
        isExist.id,
        dataUpdate,
      )) as Cart
    }
    return (await super.addLineItem(cartId, lineItem, config)) as Cart
  }

  // fix bug add a new line item when need update (when have the same variant id)
  async addLineItem(
    cartId: string,
    lineItem: LineItem,
    config = { validateSalesChannels: true },
  ): Promise<Cart> {
    const lineItemRepo = this.manager.getCustomRepository(
      this.lineItemRepository_,
    )
    const lineItemAddonsRepo = this.manager.getCustomRepository(
      this.lineItemAddonsRepo,
    )

    let updatedItem: LineItem
    const items = (await lineItemRepo.find({
      where: { cart_id: cartId, variant_id: lineItem.variant_id },
      select: ['id', 'quantity'],
    })) as LineItem[]
    const metadata = lineItem.metadata as any

    if (metadata.addons?.length) {
      // have addon
      let updatedId: string
      if (items.length) {
        // check if this line item with addon already exist
        for (const item of items) {
          const lineItemAddons = await lineItemAddonsRepo.find({
            where: {
              line_item_id: item.id,
            },
          })

          const isMatchAll = metadata.addons.every((addon) => {
            return (
              lineItemAddons.findIndex(
                (a) => a.lv1_id === addon.lv1_id && a.lv2_id === addon.lv2_id,
              ) !== -1
            )
          })
          if (lineItemAddons.length === metadata.addons.length && isMatchAll) {
            updatedId = item.id
            break
          }
        }

        if (!!updatedId) {
          // remove addon, just update quantity
          lineItem.metadata = _.omit(metadata, 'addons')
          updatedItem = items.find((i) => i.id === updatedId)
        }
      }
    } else if (items.length) {
      // not have addon
      const lineItemAddons = await lineItemAddonsRepo.find({
        where: {
          line_item_id: In([...items.map((i) => i.id)]),
        },
      })
      const item = items.find((i) =>
        lineItemAddons.every((ia) => ia.line_item_id !== i.id),
      )
      if (!!item) {
        updatedItem = item
      }
    }

    if (!!updatedItem) {
      const dataUpdate: any = {
        ...lineItem,
        quantity: lineItem.quantity
          ? lineItem.quantity + updatedItem.quantity
          : updatedItem.quantity,
      }

      return (await super.updateLineItem(
        cartId,
        updatedItem.id,
        dataUpdate,
      )) as Cart
    }

    return (await super.addLineItem(cartId, lineItem, config)) as Cart
  }

  // overide cart and lineitem price calculation
  async decorateTotals(cart: Cart, totalsConfig?: TotalsConfig): Promise<Cart> {
    const discountRuleRepo = this.manager.getCustomRepository(
      this.discountRuleRepo_,
    )
    const totalsService = this.totalsService_

    const calculationContext = await totalsService.getCalculationContext(cart, {
      exclude_shipping: true,
    })

    cart.items = await Promise.all(
      (cart.items || []).map(async (item) => {
        const itemTotals = await totalsService.getLineItemTotals(item, cart, {
          include_tax: totalsConfig?.force_taxes || cart.region.automatic_taxes,
          calculation_context: calculationContext,
        })

        return Object.assign(item, itemTotals)
      }),
    )

    cart.shipping_methods = await Promise.all(
      (cart.shipping_methods || []).map(async (shippingMethod) => {
        const shippingTotals = await totalsService.getShippingMethodTotals(
          shippingMethod,
          cart,
          {
            include_tax:
              totalsConfig?.force_taxes || cart.region.automatic_taxes,
            calculation_context: calculationContext,
          },
        )

        if (shippingMethod?.shipping_option?.provider_id) {
          shippingMethod.shipping_option.provider =
            await this.fulfillmentProviderService.retrieve(
              shippingMethod.shipping_option.provider_id,
              { select: ['id', 'name', 'is_free'] },
            )
        }
        return Object.assign(shippingMethod, shippingTotals)
      }),
    )

    await this.totalService.decorateBulkShippingPrice(cart)

    // cart gift cover total
    cart.gift_cover_total = await this.totalService.getGiftCoverTotal(cart)

    // cart addon total
    cart.addon_total = cart.items.reduce(
      (acc: number, item: LineItem & LineItemTotals) => {
        return acc + (item.addon_subtotal_price || 0) * item.quantity
      },
      0,
    )

    cart.shipping_total = cart.items.reduce((acc, item: LineItem) => {
      return acc + (item.shipping_total ?? 0)
    }, 0)

    cart.subtotal = cart.items.reduce((acc, item) => {
      return acc + (item.subtotal ?? 0)
    }, 0)

    cart.discount_total = await this.totalService.getDiscountTotal(cart)

    cart.item_tax_total = cart.items.reduce((acc, item) => {
      return acc + (item.tax_total ?? 0)
    }, 0)

    cart.shipping_tax_total = cart.shipping_methods.reduce((acc, method) => {
      return acc + (method.tax_total ?? 0)
    }, 0)

    const giftCardTotal = await totalsService.getGiftCardTotal(cart, {
      gift_cardable: cart.subtotal - cart.discount_total,
    })
    cart.gift_card_total = giftCardTotal.total || 0
    cart.gift_card_tax_total = giftCardTotal.tax_total || 0

    cart.tax_total = cart.item_tax_total + cart.shipping_tax_total

    cart.original_total =
      cart.subtotal + cart.shipping_total + cart.gift_cover_total
    cart.total =
      cart.subtotal +
      cart.gift_cover_total +
      cart.shipping_total +
      cart.tax_total -
      (cart.gift_card_total + cart.discount_total + cart.gift_card_tax_total)

    // add additional discount field
    this.decorateDiscount(cart)

    let usedPoint = 0

    const discountPoint = cart.discounts.find(
      (e: Discount) => e.type === DiscountType.POINT,
    )

    if (discountPoint) {
      usedPoint = discountPoint?.rule?.value
    }

    if (cart.total - usedPoint < 0) {
      usedPoint = cart.total

      await discountRuleRepo.update(discountPoint.rule_id, {
        value: usedPoint,
      })
    }

    cart.discount_total += usedPoint
    cart.total = cart.total - usedPoint

    return cart
  }

  protected async updateBillingAddress_(
    cart: Cart,
    addressOrId: AddressPayload | Partial<Address> | string,
    addrRepo: AddressRepository,
  ): Promise<void> {
    let address: Address

    if (typeof addressOrId === `string`) {
      address = (await addrRepo.findOne({
        where: { id: addressOrId },
      })) as Address
    } else {
      address = addressOrId as Address
    }

    address.country_code = address.country_code?.toLowerCase() ?? null

    if (address.id) {
      cart.billing_address = await addrRepo.save(address)
    } else {
      const newAddr = await addrRepo.save(
        addrRepo.create({ ...address, customer_id: null }),
      )

      cart.billing_address = newAddr
    }
  }

  protected async updateShippingAddress_(
    cart: Cart,
    addressOrId: AddressPayload | Partial<Address> | string,
    addrRepo: AddressRepository,
  ): Promise<void> {
    let address: Address

    if (addressOrId === null) {
      cart.shipping_address = null
      return
    }

    if (typeof addressOrId === `string`) {
      address = (await addrRepo.findOne({
        where: { id: addressOrId },
      })) as Address
    } else {
      address = addressOrId as Address
    }

    address.country_code = address.country_code?.toLowerCase() ?? null

    if (
      address.country_code &&
      !cart.region.countries.find(({ iso_2 }) => address.country_code === iso_2)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Shipping country must be in the cart region',
      )
    }

    if (address.id) {
      cart.shipping_address = await addrRepo.save(address)
    } else {
      const toSave = addrRepo.create({
        ...address,
        country_code: JAPANESE_COUNTRY_ISO2,
      })

      if (address.is_show) {
        toSave.customer_id = cart.customer_id
      } else {
        toSave.customer_id = null
      }

      const newAddr = await addrRepo.save(toSave)

      cart.shipping_address = newAddr
    }
  }

  async update(cartId: string, data: CartUpdateInput): Promise<Cart> {
    return this.atomicPhase_(async (transactionManager) => {
      const cartRepo = transactionManager.getCustomRepository(
        this.cartRepository_,
      )
      const addressRepo = transactionManager.getCustomRepository(
        this.addressRepository_,
      )
      const isOwnShipping = data.is_own_shipping
      const billingAddress = data.billing_address_id ?? data.billing_address
      delete data.billing_address
      delete data.billing_address_id
      delete data.is_own_shipping

      let cart = (await super.update(cartId, data)) as Cart

      if (isOwnShipping) {
        cart.billing_address = cart.shipping_address
      } else if (billingAddress) {
        await this.withTransaction(transactionManager).updateBillingAddress_(
          cart,
          billingAddress,
          addressRepo,
        )
      }

      cart = await cartRepo.save(cart)

      return cart
    })
  }

  async authorizeGmoCardPayment(
    cartId: string,
    input: AuthorizeCartPaymentInput,
  ) {
    return await this.atomicPhase_(async (transactionManager) => {
      const cart = await this.retrieveWithTotals(cartId, {
        select: defaultStoreCartFields,
        relations: defaultStoreCartRelations,
      })

      cart.payment_session = cart.payment_sessions.find((ps) => ps.is_selected)

      if (!cart.payment_session) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Can not authorized cart with no payment session',
        )
      }

      let session: PaymentSession = await this.paymentProviderService_
        .withTransaction(transactionManager)
        .retrieveSession(cart.payment_session.id)
        .catch(() => void 0)

      if (!session || session.provider_id !== GMO_CARD_ID) return

      const provider = await this.paymentProviderService_
        .withTransaction(transactionManager)
        .retrieveProvider(session.provider_id)

      const { status, data } = await provider
        .withTransaction(transactionManager)
        .authorizePaymentNew(session, input)

      session.data = data
      session.status = status

      const sessionRepo = transactionManager.getCustomRepository(
        this.paymentSessionRepository_,
      )
      session = await sessionRepo.save(session)

      return cart
    })
  }

  async removeLineItem(cartId: string, lineItemId: string): Promise<Cart> {
    return this.atomicPhase_(async (tx) => {
      const shippingMethodRepo = tx.getCustomRepository(
        this.shippingMethodRepository_,
      )
      const result = await super.removeLineItem(cartId, lineItemId)

      const lineItem = (await this.lineItemService_.retrieve(
        lineItemId,
      )) as LineItem

      // remove shipping method attached to that line item
      if (lineItem.shipping_method_id) {
        await shippingMethodRepo.delete({ id: lineItem.shipping_method_id })
      }

      return result as Cart
    })
  }

  decorateDiscount(cart: Cart) {
    const pointDiscount = cart.discounts?.find(
      (discount: Discount) => discount.type === DiscountType.POINT,
    )
    const promoCodeDiscount = cart.discounts?.find(
      (d: Discount) => d.type === DiscountType.PROMO_CODE,
    )

    cart.used_promo_code = promoCodeDiscount?.code
    cart.used_point = pointDiscount?.rule?.value || 0
  }

  async getStoreFreeShippingLeft(cartId: string, storeId: string) {
    const cart = await this.retrieveWithTotals(cartId)
    const store = await this.storeService.retrieve_(storeId, {
      select: ['id', 'free_ship_amount'],
    })

    const storeTotal = cart.items.reduce((acc, item: LineItem) => {
      if (item.store_id === storeId) acc += item.subtotal || 0

      return acc
    }, 0)

    let amountToFreeShip = 0

    if (store.free_ship_amount === 0) {
      amountToFreeShip = 0
    } else {
      amountToFreeShip = Math.max(0, store.free_ship_amount - storeTotal)
    }

    return {
      cart_total: cart.total,
      store_total: storeTotal,
      amount_to_free: amountToFreeShip,
      free_ship_amount: store.free_ship_amount,
    }
  }
  async applyDiscount(cart: Cart, discountCode: string): Promise<void> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const discount = (await this.discountService_
          .withTransaction(transactionManager)
          .retrieveByCode(discountCode, {
            relations: ['rule', 'regions', 'users'],
          })) as Discount

        await this.discountService_
          .withTransaction(transactionManager)
          .validateDiscountForCartOrThrow(cart, discount)

        // if discount is already there, we simply resolve
        if (cart.discounts.find(({ id }) => id === discount.id)) {
          return
        }

        // incase of promotion code discount, check if that user already used this code or not
        const isUsed =
          discount.type === DiscountType.PROMO_CODE &&
          discount.users.some((user) => user.id === cart.customer_id)
        if (isUsed)
          throw new MedusaError(
            MedusaError.Types.DUPLICATE_ERROR,
            'This user already used this promo code',
          )

        const newDiscounts = [...cart.discounts, discount]

        // let sawNotShipping = false
        // const newDiscounts = toParse.map((discountToParse) => {
        //   switch (discountToParse.rule?.type) {
        //     case DiscountRuleType.FREE_SHIPPING:
        //       if (discountToParse.rule.type === rule.type) {
        //         return discount
        //       }
        //       return discountToParse
        //     default:
        //       if (!sawNotShipping) {
        //         sawNotShipping = true
        //         if (rule?.type !== DiscountRuleType.FREE_SHIPPING) {
        //           return discount
        //         }
        //         return discountToParse
        //       }
        //       return null
        //   }
        // })

        cart.discounts = newDiscounts.filter(
          (newDiscount): newDiscount is Discount => {
            return !!newDiscount
          },
        )

        // ignore if free shipping
        // if (rule?.type !== DiscountRuleType.FREE_SHIPPING && cart?.items) {
        //   await this.refreshAdjustments_(cart)
        // }
      },
    )
  }

  async retrieveById(
    discountId: string,
    config: FindConfig<Discount> = {},
  ): Promise<Discount> {
    const manager = this.manager_
    const discountRepo = manager.getCustomRepository(this.discountRepo_)

    let query = buildQuery({ id: discountId, is_dynamic: false }, config)
    let discount = await discountRepo.findOne(query)

    if (!discount) {
      query = buildQuery({ id: discountId, is_dynamic: true }, config)
      discount = await discountRepo.findOne(query)

      if (!discount) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Discount with code ${discountId} was not found`,
        )
      }
    }

    return discount
  }

  async removeDiscountById(cartId: string, discountId: string): Promise<Cart> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const cart = (await this.retrieve(cartId, {
          relations: [
            'discounts',
            'discounts.rule',
            'payment_sessions',
            'shipping_methods',
            'items',
          ],
        })) as Cart

        if (
          cart.discounts.some(
            ({ rule }) => rule.type === DiscountRuleType.FREE_SHIPPING,
          )
        ) {
          await this.adjustFreeShipping_(cart, false)
        }

        cart.discounts = cart.discounts.filter(
          (discount) => discount.id !== discountId,
        )

        const cartRepo = transactionManager.getCustomRepository(
          this.cartRepository_,
        )
        const updatedCart = await cartRepo.save(cart)

        if (updatedCart.payment_sessions?.length) {
          await this.setPaymentSessions(cartId)
        }

        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(CartService.Events.UPDATED, updatedCart)

        return updatedCart
      },
    )
  }

  protected async adjustFreeShipping_(cart: Cart, shouldAdd: boolean) {
    const transactionManager = this.transactionManager_ ?? this.manager_

    const shippingMethodRepository = transactionManager.getCustomRepository(
      this.shippingMethodRepository_,
    )

    const disConditionRepo = transactionManager.getCustomRepository(
      this.discConditionRepo_,
    )

    const discount = cart.discounts.find(
      (e) => e.rule.type === DiscountRuleType.FREE_SHIPPING,
    )

    await Promise.all(
      cart.items?.map(async (item) => {
        const isStore = await disConditionRepo.canApplyForStore(
          discount.rule_id,
          (item as LineItem).store_id,
        )

        const isProduct = await disConditionRepo.canApplyForProducts(
          discount.rule_id,
          item.variant.product_id,
        )

        const isType = await disConditionRepo.canApplyForProductTypes(
          discount.rule_id,
          item.variant.product_id,
        )

        const isSale = await this.checkDiscountSale(
          (discount as Discount).is_sale,
          item as LineItem,
        )

        const isStoreApply = await this.checkStoreApplyItem(
          item as LineItem,
          discount as Discount,
        )

        if (isStore && isProduct && isType && isSale && isStoreApply) {
          if (shouldAdd) {
            await shippingMethodRepository.update(
              {
                id: (item as LineItem).shipping_method_id,
              },
              {
                price: 0,
              },
            )
          } else {
            const shippingMethod = await shippingMethodRepository.findOne(
              (item as LineItem).shipping_method_id,
            )
            shippingMethod.price = await this.shippingOptionService_.getPrice_(
              shippingMethod.shipping_option,
              shippingMethod.data,
              cart,
            )

            return shippingMethodRepository.save(shippingMethod)
          }
        }
      }),
    )
  }

  async applyDiscountCoupon(cart: Cart, discountId: string): Promise<void> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const discount = await this.withTransaction(
          transactionManager,
        ).retrieveById(discountId, { relations: ['rule', 'regions'] })

        await this.discountService_
          .withTransaction(transactionManager)
          .validateDiscountForCartOrThrow(cart, discount)

        const rule = discount.rule

        // if discount is already there, we simply resolve
        if (cart.discounts.find(({ id }) => id === discount.id)) {
          return
        }

        const toParse = [...cart.discounts, discount]

        let sawNotShipping = false
        const newDiscounts = toParse.map((discountToParse) => {
          switch (discountToParse.rule?.type) {
            case DiscountRuleType.FREE_SHIPPING:
              if (discountToParse.rule.type === rule.type) {
                return discount
              }
              return discountToParse
            default:
              if (!sawNotShipping) {
                sawNotShipping = true
                if (rule?.type !== DiscountRuleType.FREE_SHIPPING) {
                  return discount
                }
                return discountToParse
              }
              return null
          }
        })

        cart.discounts = newDiscounts.filter(
          (newDiscount): newDiscount is Discount => {
            return !!newDiscount
          },
        )

        // ignore if free shipping
        if (rule?.type !== DiscountRuleType.FREE_SHIPPING && cart?.items) {
          await this.refreshAdjustments_(cart)
        }

        if (rule?.type === DiscountRuleType.FREE_SHIPPING) {
          await this.adjustFreeShipping_(cart, true)
        }
      },
    )
  }

  async upsertCartDiscount(cartId: string, data: UpsertCartDiscountReq) {
    return this.atomicPhase_(async (transactionManager) => {
      const cartRepo = transactionManager.getCustomRepository(
        this.cartRepository_,
      )

      const cartWithDiscounts = await this.retrieveWithTotals(cartId, {
        relations: ['discounts', 'discounts.rule', 'items'],
      })

      const promoCodeDiscount = cartWithDiscounts.discounts.find(
        (discount: Discount) => discount.type === DiscountType.PROMO_CODE,
      )

      const couponDiscount = cartWithDiscounts.discounts.find(
        (discount: Discount) => discount.type === DiscountType.COUPON,
      )

      if (isDefined(data.promo_code_id)) {
        const promoCodeId = data.promo_code_id

        const newPromoCodeDiscount = await this.discountService_.retrieve(
          promoCodeId,
        )

        const checkAvailable = await this.checkPromoCodeAvailable(
          newPromoCodeDiscount as Discount,
          cartWithDiscounts,
        )

        if (
          !checkAvailable ||
          (newPromoCodeDiscount as Discount).status !== DiscountStatus.PUBLISHED
        ) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            'Discount is not available',
          )
        }

        if (promoCodeDiscount?.id !== newPromoCodeDiscount.id) {
          cartWithDiscounts.discounts = cartWithDiscounts.discounts.filter(
            (d) => d.id !== promoCodeDiscount?.id,
          )
          await this.withTransaction(transactionManager).applyDiscount(
            cartWithDiscounts as Cart,
            newPromoCodeDiscount.code,
          )
        }
      } else if (isDefined(data.coupon_id)) {
        const coupon_id = data.coupon_id
        const newCoupon = await this.discountService_.retrieve(coupon_id)

        const checkStore = await this.applyStore(
          cartWithDiscounts,
          newCoupon as Discount,
        )

        if (
          !checkStore ||
          (newCoupon as Discount).status !== DiscountStatus.PUBLISHED
        ) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            'Discount is not available',
          )
        }

        if (couponDiscount?.id !== newCoupon.id) {
          cartWithDiscounts.discounts = cartWithDiscounts.discounts.filter(
            (d) => d.id !== couponDiscount?.id,
          )
          await this.withTransaction(transactionManager).applyDiscountCoupon(
            cartWithDiscounts as Cart,
            newCoupon.id,
          )
        }
      } else {
        if (couponDiscount) {
          await this.removeDiscountById(cartId, couponDiscount.id)
        }

        if (promoCodeDiscount) {
          await this.removeDiscount(cartId, promoCodeDiscount.code)
        }
        cartWithDiscounts.discounts = cartWithDiscounts.discounts.filter(
          (discount: Discount) => {
            discount.type !== DiscountType.PROMO_CODE
          },
        )

        cartWithDiscounts.discounts = cartWithDiscounts.discounts.filter(
          (discount: Discount) => {
            discount.type !== DiscountType.COUPON
          },
        )
      }

      if (isDefined(data.used_point)) {
        // check if used point is valid
        await this.pointService
          .withTransaction(transactionManager)
          .validCustomerPointOrThrow(cartWithDiscounts as Cart, data.used_point)
        const newVal = convertPointToMoney(data.used_point)

        const pointDiscount = cartWithDiscounts.discounts.find(
          (discount: Discount) => discount.type === DiscountType.POINT,
        )

        if (pointDiscount) {
          if (newVal <= 0) {
            cartWithDiscounts.discounts = cartWithDiscounts.discounts.filter(
              (discount: Discount) => discount.type !== DiscountType.POINT,
            )
          } else {
            await this.discountService_
              .withTransaction(transactionManager)
              .update(pointDiscount.id, {
                rule: { value: newVal, id: pointDiscount.rule_id },
              })
          }
        } else {
          if (newVal > 0) {
            const newDiscount = await this.discountService_.create({
              code: uuid(),
              is_disabled: false,
              is_dynamic: false,
              rule: {
                value: newVal,
                type: DiscountRuleType.FIXED,
                allocation: null,
              },
              regions: [EAST_ASIA_REGION_ID],
              // @ts-ignore
              type: DiscountType.POINT,
            })

            await this.withTransaction(transactionManager).applyDiscount(
              cartWithDiscounts as Cart,
              newDiscount.code,
            )
          }
        }
      }
      const updatedCart = await cartRepo.save({
        id: cartId,
        discounts: cartWithDiscounts.discounts,
      })

      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(CartService.Events.UPDATED, updatedCart)
    })
  }

  /**
   * Creates, updates and sets payment sessions associated with the cart. The
   * first time the method is called payment sessions will be created for each
   * provider. Additional calls will ensure that payment sessions have correct
   * amounts, currencies, etc. as well as make sure to filter payment sessions
   * that are not available for the cart's region.
   * @param cartOrCartId - the id of the cart to set payment session for
   * @return the result of the update operation.
   */
  async setPaymentSessions(cartOrCartId: Cart | string): Promise<void> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const psRepo = transactionManager.getCustomRepository(
          this.paymentSessionRepository_,
        )

        const cartId =
          typeof cartOrCartId === `string` ? cartOrCartId : cartOrCartId.id

        const cart = await this.retrieveWithTotals(
          cartId,
          {
            relations: [
              'items',
              'items.adjustments',
              'discounts',
              'discounts.rule',
              'gift_cards',
              'shipping_methods',
              'billing_address',
              'shipping_address',
              'region',
              'region.tax_rates',
              'region.payment_providers',
              'payment_sessions',
              'customer',
            ],
          },
          { force_taxes: true },
        )

        const { total, region } = cart

        if (typeof total === 'undefined') {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            'cart.total must be defined',
          )
        }

        // If there are existing payment sessions ensure that these are up to date
        const seen: string[] = []
        if (cart.payment_sessions?.length) {
          await Promise.all(
            cart.payment_sessions.map(async (paymentSession) => {
              if (
                total < 0 ||
                !region.payment_providers.find(
                  ({ id }) => id === paymentSession.provider_id,
                )
              ) {
                return this.paymentProviderService_
                  .withTransaction(transactionManager)
                  .deleteSession(paymentSession)
              } else {
                seen.push(paymentSession.provider_id)
                return this.paymentProviderService_
                  .withTransaction(transactionManager)
                  .updateSession(paymentSession, cart)
              }
            }),
          )
        }

        if (total >= 0) {
          // If only one payment session exists, we preselect it
          if (region.payment_providers.length === 1 && !cart.payment_session) {
            const paymentProvider = region.payment_providers[0]
            const paymentSession = await this.paymentProviderService_
              .withTransaction(transactionManager)
              .createSession(paymentProvider.id, cart)

            paymentSession.is_selected = true

            await psRepo.save(paymentSession)
          } else {
            await Promise.all(
              region.payment_providers.map(async (paymentProvider) => {
                if (!seen.includes(paymentProvider.id)) {
                  return this.paymentProviderService_
                    .withTransaction(transactionManager)
                    .createSession(paymentProvider.id, cart)
                }
                return
              }),
            )
          }
        }
      },
    )
  }

  async sanitizeItems(cartId: string): Promise<boolean> {
    return this.atomicPhase_(async (tx) => {
      const cart = (await this.withTransaction(tx).retrieve(cartId, {
        relations: ['items'],
      })) as Cart

      let isChanged = false

      await Promise.all(
        cart.items.map(async (item: LineItem) => {
          const data = await this.pricingService.setVariantPrices(
            [item.variant],
            {
              currency_code: JAPANESE_CURRENCY_CODE,
            },
          )

          if (!data?.length) {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              'Variants not found!',
            )
          }

          if (data[0].calculated_price !== item.unit_price) {
            await this.lineItemService_
              .withTransaction(tx)
              .update(item.id, { unit_price: data[0].calculated_price })
            isChanged = true
          }

          const productStat = item.variant?.product?.status
          const storeStat = item.store?.status
          const isSoldOut =
            item.variant?.manage_inventory &&
            item.variant.inventory_quantity === 0

          if (
            productStat !== ProductStatus.PUBLISHED ||
            storeStat !== StoreStatus.APPROVED ||
            isSoldOut
          ) {
            const methodRepo = tx.getCustomRepository(
              this.shippingMethodRepository_,
            )
            isChanged = true
            // remove line item
            await this.lineItemService_.withTransaction(tx).delete(item.id)

            // remove shipping method
            if (item.shipping_method_id) {
              await methodRepo.delete({ id: item.shipping_method_id })
            }
          }
        }),
      )

      return isChanged
    })
  }

  async sanitizeDiscounts(cart: Cart): Promise<UpsertCartDiscountReq> {
    return this.atomicPhase_(async (tx) => {
      const discRepo = tx.getCustomRepository(this.discConditionRepo_)
      const discounts = cart.discounts
      const result: UpsertCartDiscountReq = {
        used_point: 0,
        promo_code_id: undefined,
        coupon_id: undefined,
      }
      for (const item of discounts) {
        if ((item as Discount).type === DiscountType.POINT) {
          result.used_point = item.rule.value
        } else {
          const available = await this.checkAvailable(item as Discount)

          let apply = true
          if ((item as Discount)?.is_target_user) {
            apply = await discRepo.canApplyForCustomer(
              item.rule_id,
              cart.customer_id,
            )
          }

          const isCart = await discRepo.canApplyForCart(
            item?.rule_id,
            cart as Cart,
            (item as Discount)?.amount_limit,
          )

          const isSale = await this.checkDiscountSaleWithCart(
            (item as Discount).is_sale,
            cart as Cart,
          )

          const isIssuance = await this.checkDiscountIssuance(
            item as Discount,
            cart.customer_id,
          )

          const isStoreApply = await this.checkStoreApplyCart(
            cart,
            item as Discount,
          )

          const isStore = await this.applyStore(cart, item as Discount)

          if (
            apply &&
            available &&
            isCart &&
            isSale &&
            isIssuance &&
            isStoreApply &&
            isStore
          ) {
            if ((item as Discount).type === DiscountType.COUPON) {
              result.coupon_id = item.id
            }
            if ((item as Discount).type === DiscountType.PROMO_CODE) {
              result.promo_code_id = item.id
            }
          }
        }
      }
      return result
    })
  }

  async getListCoupon(
    selector: Selector<Discount>,
    config: FindConfig<Discount>,
    cart: Cart,
    userId?: string,
  ) {
    const discountRepo = this.manager_.getCustomRepository(this.discountRepo_)
    const udRepo = this.manager_.getCustomRepository(this.userDiscountRepo_)
    const ucRepo = this.manager_.getCustomRepository(this.urCouponRepo_)

    const tmp = await udRepo.find({
      user_id: userId,
    })

    const onwerCoupon = await ucRepo.find({ user_id: userId })

    const minusIds = tmp.map((e) => e.discount_id)

    const ownerIds = onwerCoupon.map((e) => e.discount_id)

    const query = buildQuery(selector, config)

    if (userId) {
      const ids = await this.getCouponAvailable(userId, cart, ownerIds)
      query.where = [
        {
          ...selector,
          status: DiscountStatus.PUBLISHED,
          rule_id: In(ids),
          id: Not(In(minusIds)),
        },
      ]
    }

    return await discountRepo.findAndCount(query)
  }

  async checkAvailable(data: Discount) {
    if (!data) {
      return false
    }

    const toDay = new Date()

    if (data?.starts_at && data?.starts_at > toDay) {
      return false
    }

    if (data?.ends_at && data?.ends_at < toDay) {
      return false
    }

    if (data.usage_limit && data.usage_limit === data.usage_count) {
      return false
    }
    return true
  }

  async getCouponAvailable(userId: string, cart: Cart, ids: string[]) {
    return this.atomicPhase_(async (tx) => {
      const discRepo = tx.getCustomRepository(this.discConditionRepo_)
      const discountRepo = tx.getCustomRepository(this.discountRepo_)

      const query = buildQuery(
        {
          type: DiscountType.COUPON,
          title: Not(IsNull()),
          id: In(ids),
          status: DiscountStatus.PUBLISHED,
          parent_discount_id: IsNull(),
        },
        {
          order: { created_at: 'DESC' },
        },
      )

      const tmp = await discountRepo.find(query)
      const result = []

      for (const item of tmp) {
        const available = await this.checkAvailable(item)

        let apply = true

        if (item?.is_target_user) {
          apply = await discRepo.canApplyForCustomer(item.rule_id, userId)
        }

        const isCart = await discRepo.canApplyForCart(
          item.rule_id,
          cart as Cart,
          item.amount_limit,
        )

        const isStore = await this.applyStore(cart, item)

        let isStoreApply = true
        if (item.store_apply === StoreApplyEnum.STORE) {
          isStoreApply = await this.checkStoreApplyCart(cart, item)
        }

        const isSale = await this.checkDiscountSaleWithCart(item.is_sale, cart)

        const isIssuance = await this.checkDiscountIssuance(item, userId)

        if (
          apply &&
          available &&
          isCart &&
          isSale &&
          isIssuance &&
          isStoreApply &&
          isStore
        ) {
          result.push(item.rule_id)
        }
      }

      return Array.from(new Set(result))
    })
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

  async checkStoreApplyCart(cart: Cart, discount: Discount): Promise<boolean> {
    return this.atomicPhase_(async (tm) => {
      const storeRepo = tm.getCustomRepository(this.storeRepo_)
      if (
        discount.store_apply === StoreApplyEnum.ALL ||
        discount.store_apply === StoreApplyEnum.CSV
      ) {
        return true
      }

      for (const item of cart.items) {
        const store = await storeRepo.findOne((item as LineItem).store_id)

        if (store.created_at >= discount.released_at) {
          return true
        }
      }
      return false
    })
  }

  async checkStoreApplyItem(
    item: LineItem,
    discount: Discount,
  ): Promise<boolean> {
    return this.atomicPhase_(async (tm) => {
      const storeRepo = tm.getCustomRepository(this.storeRepo_)
      if (
        discount.store_apply === StoreApplyEnum.ALL ||
        discount.store_apply === StoreApplyEnum.CSV
      ) {
        return true
      }

      const store = await storeRepo.findOne((item as LineItem).store_id)

      if (store.created_at >= discount.released_at) {
        return true
      }

      return false
    })
  }

  async checkDiscountSaleWithCart(
    isSale: boolean,
    cart: Cart,
  ): Promise<boolean> {
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

    for (const item of cart.items) {
      const amount = await moneyAmountRepo
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

      if ((isSale && amount >= 0) || amount === 0) {
        return true
      }
    }
    return false
  }

  async checkDiscountIssuance(
    discount: Discount,
    userId: string,
  ): Promise<boolean> {
    const userRepo = this.manager_.getCustomRepository(this.userRepo_)
    const storeDetailRepo_ = this.manager_.getCustomRepository(
      this.storeDetailRepo_,
    )
    const favoriteRepo = this.manager_.getCustomRepository(this.favoriteRepo)
    const reviewRepo = this.manager_.getCustomRepository(this.reviewsRepo)
    const storeFavoriteRepo = this.manager_.getCustomRepository(
      this.storeFavoriteRepo,
    )

    if (
      discount.issuance_timing === IssuanceTimingEnum.NONE ||
      discount.issuance_timing === IssuanceTimingEnum.MEMBER_REGISTER ||
      !discount.issuance_timing
    ) {
      return true
    }
    if (discount.issuance_timing === IssuanceTimingEnum.BIRTH_MONTH) {
      const today = dayjs()
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0)
        .utc()
        .format('MM')

      const storeDetails = await storeDetailRepo_
        .createQueryBuilder('sd')
        .select('id')
        .where(`to_char(sd.birthday, 'MM') = '${today}'`)
        .getRawMany()

      const details = storeDetails.map((e) => e.id)

      if (details?.length < 1) {
        return false
      }
      const users = await userRepo
        .createQueryBuilder('u')
        .innerJoin(
          'store',
          's',
          `s.id = u.store_id AND s.store_detail_id IN (:...details)`,
          { details },
        )
        .where(`u.id = '${userId}'`)
        .getCount()

      if (users > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.AFTER_ORDERING) {
      const orderRepo = this.manager_.getCustomRepository(this.orderRepo)
      const orders = await orderRepo
        .createQueryBuilder('o')
        .where(`o.customer_id = '${userId}' and o.parent_id is null`)
        .take(1)
        .getCount()
      if (orders > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.REVIEWED) {
      const reviews = await reviewRepo
        .createQueryBuilder('rw')
        .where(`rw.user_id = '${userId}'`)
        .take(1)
        .getCount()
      if (reviews > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.FAVORITE) {
      const favorites = await favoriteRepo
        .createQueryBuilder('fav')
        .where(`fav.user_id = '${userId}'`)
        .take(1)
        .getCount()
      if (favorites > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.FOLLOW) {
      const follow = await storeFavoriteRepo
        .createQueryBuilder('sf')
        .where(`sf.user_id = '${userId}'`)
        .take(1)
        .getCount()

      if (follow > 0) {
        return true
      }
    }
    return false
  }

  async checkPromoCodeAvailable(
    discount: Discount,
    cart: Cart,
  ): Promise<boolean> {
    return this.atomicPhase_(async (tm) => {
      const discRepo = tm.getCustomRepository(this.discConditionRepo_)
      const checkCart = await discRepo.canApplyForCart(
        discount.rule_id,
        cart,
        discount.amount_limit,
      )
      if (!checkCart) {
        return false
      }

      const isSale = await this.checkDiscountSaleWithCart(
        discount.is_sale,
        cart,
      )

      if (!isSale) {
        return false
      }

      const isIssuance = await this.checkDiscountIssuance(
        discount,
        cart.customer_id,
      )

      if (!isIssuance) {
        return false
      }

      const checkAvailable = await this.checkAvailable(discount)
      if (!checkAvailable) {
        return false
      }

      const isStore = await this.applyStore(cart, discount)
      if (!isStore) {
        return false
      }

      return true
    })
  }

  async applyStore(cart: Cart, discount: Discount): Promise<boolean> {
    if (!discount.store_id) {
      return true
    }
    for (const item of cart.items) {
      if ((item as LineItem).store_id === discount.store_id) {
        return true
      }
    }
    return false
  }

  async syncCartWithCustomer(userId: string, cartId: string) {
    return this.atomicPhase_(async (tm) => {
      const userRepo = tm.getCustomRepository(this.userRepo_)

      let user = await userRepo.findOne(userId)

      if (!user.cart_id) {
        await userRepo.update(userId, {
          cart_id: cartId,
        })
        return { id: cartId, data: [] }
      }

      const cart = await this.withTransaction(tm).retriveCartWithCustomer(
        user.cart_id,
        userId,
      )

      if (cart.completed_at) {
        await userRepo.update(userId, {
          cart_id: cartId,
        })

        user = await userRepo.findOne(userId)
      }

      const line_items = await this.lineItemService_
        .withTransaction(tm)
        .list({ cart_id: cartId }, { relations: ['line_item_addons'] })

      const toSync = []
      if (line_items?.length) {
        line_items.map((e: LineItem) => {
          const metadata: StorePostCartLineItemAddon[] = []
          if (e?.line_item_addons?.length) {
            e.line_item_addons.map((i) => {
              metadata.push({
                lv1_id: i.lv1_id,
                lv2_id: i.lv2_id,
                price: i.price,
              })
            })
          }
          toSync.push({
            variant_id: e.variant_id,
            quantity: e.quantity,
            metadata: { addons: metadata },
          })
        })
      }
      return { id: user.cart_id, data: toSync }
    })
  }
}
