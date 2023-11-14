import { AllocationType, DiscountRuleType, Region } from '@medusajs/medusa'
import { CartRepository } from '@medusajs/medusa/dist/repositories/cart'
import { GiftCardRepository } from '@medusajs/medusa/dist/repositories/gift-card'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { PriceListRepository } from '@medusajs/medusa/dist/repositories/price-list'
import {
  CustomerService,
  DiscountService as MedusaDiscountService,
  EventBusService,
  RegionService,
} from '@medusajs/medusa/dist/services'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { FilterableDiscountProps } from '@medusajs/medusa/dist/types/discount'
import { buildQuery, formatException } from '@medusajs/medusa/dist/utils'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import {
  DeepPartial,
  EntityManager,
  In,
  IsNull,
  MoreThanOrEqual,
  Not,
} from 'typeorm'

import { Cart } from '../../cart/entity/cart.entity'
import { LineItem } from '../../cart/entity/line-item.entity'
import { TotalsService } from '../../cart/services/totals.service'
import { ProductFavoriteRepository } from '../../favorite/repository/product-favorite.repository'
import { StoreFavoriteRepository } from '../../favorite/repository/store-favorite.repository'
import { Order } from '../../order/entity/order.entity'
import { OrderRepository } from '../../order/repository/order.repository'
import { ProductReviewsRepository } from '../../product/repository/product-reviews.repository'
import { StoreDetailRepository } from '../../store/repository/store-detail.repository'
import { UserStatus } from '../../user/entity/user.entity'
import UserService from '../../user/services/user.service'
import UserRepository from '../../user/user.repository'
import { CustomerGroupCustomers } from '../entities/customer-group-customers.entity'
import {
  AvailableStatusEnum,
  Discount,
  DiscountStatus,
  DiscountType,
  IssuanceTimingEnum,
  StoreApplyEnum,
} from '../entities/discount.entity'
import { DiscountRule } from '../entities/discount-rule.entity'
import { CustomerGroupCustomersRepository } from '../repository/customer-group-customers.repository'
import { DiscountRepository } from '../repository/discount.repository'
import { DiscountConditionRepository } from '../repository/discount-condition.repository'
import { DiscountRuleRepository } from '../repository/discount-rule.repository'
import { UserCouponRepository } from '../repository/user-coupon.repository'
import { UserDiscountRepository } from '../repository/user-discount.repository'
import { ProductService } from './../../product/services/product.service'
import {
  DiscountConditionService,
  UpsertDiscountConditionInput,
} from './discount-condition.service'
import { PromotionCodeMasterService } from './promotion-code-master.service'

dayjs.extend(utc)

type InjectedDependencies = {
  manager: EntityManager
  discountRepository: typeof DiscountRepository
  customerGroupCustomersRepository: typeof CustomerGroupCustomersRepository
  discountRuleRepository: DiscountRuleRepository
  giftCardRepository: GiftCardRepository
  discountConditionRepository: typeof DiscountConditionRepository
  discountConditionService: DiscountConditionService
  totalsService: TotalsService
  productService: ProductService
  regionService: RegionService
  customerService: CustomerService
  eventBusService: EventBusService
  featureFlagRouter: FlagRouter
  userService: UserService
  userDiscountRepository: typeof UserDiscountRepository
  orderRepository: typeof OrderRepository
  promotionCodeMasterService: PromotionCodeMasterService
  userCouponRepository: typeof UserCouponRepository
  cartRepository: typeof CartRepository
  moneyAmountRepository: typeof MoneyAmountRepository
  priceListRepository: typeof PriceListRepository
  storeDetailRepository: typeof StoreDetailRepository
  userRepository: typeof UserRepository
  productReviewsRepository: typeof ProductReviewsRepository
  productFavoriteRepository: typeof ProductFavoriteRepository
  storeFavoriteRepository: typeof StoreFavoriteRepository
}

export type PriceOrderMetadata = {
  total?: number
  subtotal?: number
  discount_total?: number
  shipping_total?: number
}

export declare const DiscountConditionMapTypeToProperty: {
  products: string
  product_types: string
  product_collections: string
  product_tags: string
  customer_groups: string
  store_groups: string
}

export declare type CreateDiscountRuleInput = {
  description?: string
  type: DiscountRuleType
  value: number
  allocation: AllocationType
  conditions?: UpsertDiscountConditionInput[]
}

export declare type CreateDiscountInput = {
  code: string
  rule: CreateDiscountRuleInput
  is_dynamic: boolean
  is_disabled: boolean
  starts_at?: Date
  ends_at?: Date
  valid_duration?: string
  usage_limit?: number
  regions?: string[] | Region[]
  metadata?: Record<string, unknown>
  is_sale?: boolean
  terms_of_use?: string
  payback_rate?: number
  store_apply?: StoreApplyEnum
  issuance_timing?: IssuanceTimingEnum
  amount_limit?: number
  status?: DiscountStatus
  type?: DiscountType
  parent_discount_id?: string
  owner_store_id?: string
  title?: string
  store_target_group?: string
}

export type UpdateDiscountRuleInput = {
  id: string
  description?: string
  type?: DiscountRuleType
  value?: number
  allocation?: AllocationType
  conditions?: UpsertDiscountConditionInput[]
}

export declare type UpdateDiscountInput = {
  rule?: UpdateDiscountRuleInput
  is_disabled?: boolean
  starts_at?: Date
  ends_at?: Date | null
  valid_duration?: string | null
  usage_limit?: number | null
  regions?: string[]
  metadata?: Record<string, unknown>
  is_sale?: boolean
  terms_of_use?: string
  payback_rate?: number
  store_apply?: StoreApplyEnum
  issuance_timing?: IssuanceTimingEnum
  amount_limit?: number
  status?: DiscountStatus
}

@Service({ override: MedusaDiscountService })
export class DiscountService extends MedusaDiscountService {
  static resolutionKey = 'discountService'
  private readonly manager: EntityManager
  protected readonly discountRepository_: typeof DiscountRepository
  protected readonly customerGroupCustomersRepository_: typeof CustomerGroupCustomersRepository
  protected readonly userDiscountRepository_: typeof UserDiscountRepository
  protected userService: UserService
  protected readonly orderRepo: typeof OrderRepository
  protected promoCodemasterService_: PromotionCodeMasterService
  protected discountConditionService_: DiscountConditionService
  protected readonly dicRepo_: typeof DiscountConditionRepository
  protected readonly ucRepo_: typeof UserCouponRepository
  protected readonly cartRepo_: typeof CartRepository
  protected readonly moneyAmountRepo_: typeof MoneyAmountRepository
  protected readonly storeDetailRepo_: typeof StoreDetailRepository
  protected readonly userRepo_: typeof UserRepository
  protected readonly reviewsRepo: typeof ProductReviewsRepository
  protected readonly favoriteRepo: typeof ProductFavoriteRepository
  protected readonly storeFavoriteRepo: typeof StoreFavoriteRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager = container.manager
    this.userDiscountRepository_ = container.userDiscountRepository
    this.customerGroupCustomersRepository_ =
      container.customerGroupCustomersRepository
    this.userService = container.userService
    this.discountRepository_ = container.discountRepository
    this.orderRepo = container.orderRepository
    this.promoCodemasterService_ = container.promotionCodeMasterService
    this.discountConditionService_ = container.discountConditionService
    this.dicRepo_ = container.discountConditionRepository
    this.ucRepo_ = container.userCouponRepository
    this.cartRepo_ = container.cartRepository
    this.moneyAmountRepo_ = container.moneyAmountRepository
    this.userRepo_ = container.userRepository
    this.reviewsRepo = container.productReviewsRepository
    this.favoriteRepo = container.productFavoriteRepository
    this.storeFavoriteRepo = container.storeFavoriteRepository
    this.storeDetailRepo_ = container.storeDetailRepository
  }

  async calculateDiscountForLineItem(
    discountId: string,
    lineItem: LineItem,
    cart: Cart,
  ): Promise<number> {
    // check if point, promo_code and coupon discount => don't create adjustment for line item
    // because discount will be apply to the whole cart

    const discount = (await this.retrieve(discountId)) as Discount

    if (discount.type !== null) {
      // custom discount => apply to cart, not line item
      return 0
    }

    return await super.calculateDiscountForLineItem(discountId, lineItem, cart)
  }

  async getStoreListDiscount(
    storeId: string,
    selector: Selector<Discount>,
    config: FindConfig<Discount>,
  ) {
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )

    const query = buildQuery(selector, config)
    query.where = [
      {
        ...(selector || {}),
        store_id: storeId,
        rule: {
          type: DiscountRuleType.PERCENTAGE,
        },
      },

      {
        ...(selector || {}),
        owner_store_id: storeId,
        rule: {
          type: DiscountRuleType.PERCENTAGE,
        },
      },
    ]

    return await discountRepo.findAndCount(query)
  }

  getStoreTotalDiscount = async (storeId: string, type: DiscountType) => {
    const orderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const selector: Selector<Order> = {
      store_id: storeId,
      parent_id: Not(IsNull()),
    }

    const config: FindConfig<Order> = {
      relations: ['discounts', 'discounts.rule'],
    }

    const query = buildQuery(selector, config)
    const orders = await orderRepo.find(query)

    const arr = []
    await Promise.all(
      orders.map((order: Order) => {
        const discounts = order.discounts
        if (discounts) {
          discounts.map((discount: Discount) => {
            if (discount.type === type) {
              arr.push(discount.id)
            }
          })
        }
      }),
    )
    return [...new Set(arr)].length
  }

  async getPCAmount(storeId: string, type: DiscountType) {
    const orderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const selector: Selector<Order> = {
      store_id: storeId,
      parent_id: Not(IsNull()),
    }
    const config: FindConfig<Order> = {
      relations: ['discounts', 'discounts.rule'],
    }
    const query = buildQuery(selector, config)
    const orders = await orderRepo.find(query)

    let total = 0
    await Promise.all(
      orders.map((order: Order) => {
        const discounts = order.discounts
        const tmp: PriceOrderMetadata = order.metadata.price
        const stotal = tmp?.subtotal || 0

        if (discounts) {
          discounts.map((discount: Discount) => {
            if (discount.type === type) {
              if (discount.rule.type === DiscountRuleType.FIXED) {
                total += discount.rule.value
              } else if (discount.rule.type === DiscountRuleType.PERCENTAGE) {
                total += (stotal * discount.rule.value) / 100
              }
            }
          })
        }
      }),
    )
    return total
  }

  async addUser2ListUsed(discountId: string, userId: string) {
    const userDiscountRepo = this.manager.getCustomRepository(
      this.userDiscountRepository_,
    )

    await userDiscountRepo.save({ user_id: userId, discount_id: discountId })
  }

  async list_(
    selector: FilterableDiscountProps & {
      type?: DiscountType
      parent_discount_id?: any
    } = {},
    config: FindConfig<Discount> = {},
  ) {
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )

    const query = buildQuery(selector as Selector<Discount>, config)

    return await discountRepo.find(query)
  }

  async create(discount: CreateDiscountInput): Promise<Discount> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepository_)
      const ruleRepo = manager.getCustomRepository(this.discountRuleRepository_)

      const conditions = discount.rule?.conditions

      const ruleToCreate = _.omit(discount.rule, ['conditions'])
      const validatedRule: Omit<CreateDiscountRuleInput, 'conditions'> =
        this.validateDiscountRule_(ruleToCreate)

      if (
        discount?.regions &&
        discount?.regions.length > 1 &&
        discount?.rule?.type === 'fixed'
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Fixed discounts can have one region',
        )
      }

      if (!discount?.regions || discount?.regions.length < 0) {
        discount.regions = ['reg_east_asia']
      }

      try {
        if (discount.regions) {
          discount.regions = (await Promise.all(
            discount.regions.map(async (regionId) =>
              this.regionService_.withTransaction(manager).retrieve(regionId),
            ),
          )) as Region[]
        }

        let createdDiscountRule: any

        if (Object.keys(validatedRule).length > 0) {
          const discountRule = ruleRepo.create(validatedRule)
          createdDiscountRule = await ruleRepo.save(discountRule)
        }

        const created: Discount = discountRepo.create(
          discount as DeepPartial<Discount>,
        )

        if (createdDiscountRule) {
          created.rule = createdDiscountRule as DiscountRule
        }

        if (discount.status === DiscountStatus.PUBLISHED) {
          created.released_at = new Date()
        }
        const result = await discountRepo.save(created)

        if (conditions?.length) {
          await Promise.all(
            conditions.map(async (cond) => {
              await this.discountConditionService_
                .withTransaction(manager)
                .upsertConditions({ rule_id: result.rule_id, ...cond })
            }),
          )
        }

        return result
      } catch (error) {
        throw formatException(error)
      }
    })
  }

  async update_(
    discountId: string,
    update: UpdateDiscountInput,
  ): Promise<Discount> {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo: DiscountRepository = manager.getCustomRepository(
        this.discountRepository_,
      )
      const ruleRepo = manager.getCustomRepository(this.discountRuleRepository_)

      const discRepo = manager.getCustomRepository(
        this.discountConditionRepository_,
      )

      const discount = await this.retrieve(discountId, {
        relations: ['rule'],
      })

      const conditions = update?.rule?.conditions
      const ruleToUpdate = _.omit(update.rule, 'conditions')

      if (!_.isEmpty(ruleToUpdate)) {
        update.rule = ruleToUpdate as UpdateDiscountRuleInput
      }

      const { rule, metadata, regions, ...rest } = update

      if (rest.ends_at) {
        if (discount.starts_at >= new Date(rest.ends_at)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `"ends_at" must be greater than "starts_at"`,
          )
        }
      }

      if (regions && regions?.length > 1 && discount.rule.type === 'fixed') {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Fixed discounts can have one region',
        )
      }

      if (conditions?.length) {
        const oldConditions = await discRepo.find({
          discount_rule_id: discount.rule_id,
        })

        await Promise.all(
          oldConditions.map(async (e) => {
            if (!conditions.some((i) => i.id === e.id)) {
              await discRepo.delete({ id: e.id })
            }
          }),
        )

        await Promise.all(
          conditions.map(async (cond) => {
            await this.discountConditionService_
              .withTransaction(manager)
              .upsertConditions({ rule_id: discount.rule_id, ...cond })
          }),
        )
      } else {
        await discRepo.delete({ discount_rule_id: discount.rule_id })
      }

      if (regions) {
        discount.regions = await Promise.all(
          regions.map(async (regionId) =>
            this.regionService_.retrieve(regionId),
          ),
        )
      }

      if (metadata) {
        discount.metadata = this.setMetadata(discount, metadata)
      }

      if (rule) {
        const ruleUpdate: Omit<UpdateDiscountRuleInput, 'conditions'> = rule

        if (rule.value) {
          this.validateDiscountRule_({
            value: rule.value,
            type: discount.rule.type,
          })
        }

        discount.rule = ruleRepo.create({
          ...discount.rule,
          ...ruleUpdate,
        } as DiscountRule)
      }

      for (const key of Object.keys(rest).filter(
        (k) => typeof rest[k] !== `undefined`,
      )) {
        discount[key] = rest[key]
      }

      discount.code = discount.code.toUpperCase()
      if (
        !(discount as Discount).released_at &&
        update.status === DiscountStatus.PUBLISHED
      ) {
        discount['released_at'] = new Date()
      }

      return await discountRepo.save(discount)
    })
  }

  setMetadata(
    obj: { metadata: Record<string, unknown> | null },
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    const existing = obj.metadata || {}
    const newData = {}
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof key !== 'string') {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          'Key type is invalid. Metadata keys must be strings',
        )
      }
      newData[key] = value
    }

    return {
      ...existing,
      ...newData,
    }
  }

  async validateDiscountForCartOrThrow(
    cart: Cart,
    discount: Discount,
  ): Promise<void> {
    return await this.atomicPhase_(async () => {
      if (this.hasReachedLimit(discount)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Discount has been used maximum allowed times',
        )
      }

      if (this.hasNotStarted(discount)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Discount is not valid yet',
        )
      }

      if (this.hasExpired(discount)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Discount is expired',
        )
      }

      if (this.isDisabled(discount)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'The discount code is disabled',
        )
      }

      const isValidForRegion = await this.isValidForRegion(
        discount,
        cart.region_id,
      )
      if (!isValidForRegion) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'The discount is not available in current region',
        )
      }

      if (cart.customer_id) {
        const canApplyForCustomer = await this.canApplyForCustomer(
          discount.rule.id,
          cart.customer_id,
        )

        if (!canApplyForCustomer) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            'Discount is not valid for customer',
          )
        }
      }
    })
  }

  async getListDiscount(
    selector: Selector<Discount>,
    config: FindConfig<Discount>,
    userId?: string,
  ) {
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )

    const ucRepo = this.manager_.getCustomRepository(this.ucRepo_)

    const query = buildQuery(selector, config)

    query.where = [
      {
        status: DiscountStatus.PUBLISHED,
        type: DiscountType.COUPON,
        ends_at: MoreThanOrEqual(dayjs()),
      },
      {
        status: DiscountStatus.PUBLISHED,
        type: DiscountType.COUPON,
        ends_at: IsNull(),
      },
    ]

    let idss = []
    if (userId) {
      const ids = await this.getDiscountAvailableWithCustomer(userId)

      query.where = [
        {
          status: DiscountStatus.PUBLISHED,
          type: DiscountType.COUPON,
          ends_at: MoreThanOrEqual(dayjs()),
          rule_id: In(ids),
        },
        {
          status: DiscountStatus.PUBLISHED,
          type: DiscountType.COUPON,
          ends_at: IsNull(),
          rule_id: In(ids),
        },
      ]

      const udqr = buildQuery({ user_id: userId }, {})
      const tmp = await ucRepo.find(udqr)
      if (tmp?.length) {
        idss = tmp.map((e) => e.discount_id)
      }
    }

    const [raws, count] = await discountRepo.findAndCount(query)

    const result = await Promise.all(
      raws.map((e) => {
        return this.convertAvailableStatus(e, userId, idss)
      }),
    )

    return [result, count]
  }

  async getDiscountAvailableWithCustomer(id: string) {
    const discRepo = this.manager_.getCustomRepository(this.dicRepo_)
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )
    const query = buildQuery(
      { type: DiscountType.COUPON, status: DiscountStatus.PUBLISHED },
      {
        select: ['id', 'rule_id', 'issuance_timing', 'released_at'],
        order: { created_at: 'DESC' },
      },
    )

    const tmp = await discountRepo.find(query)

    const result = []

    for (const item of tmp) {
      const check = await discRepo.canApplyForCustomer(item.rule_id, id)
      const issuance = await this.checkDiscountIssuance(item, id)

      if (item.is_target_user && check && issuance) {
        result.push(item.rule_id)
      }
      if (!item.is_target_user && check && issuance) {
        result.push(item.rule_id)
      }
    }

    return Array.from(new Set(result))
  }

  async convertAvailableStatus(
    data: Discount,
    userId?: string,
    ids?: string[],
  ): Promise<Discount> {
    data.available_status = AvailableStatusEnum.OPEN
    const toDay = new Date()
    if (data.starts_at && data?.starts_at > toDay) {
      data.available_status = AvailableStatusEnum.EXPIRED
      return data
    }

    if (data.ends_at && data?.ends_at < toDay) {
      data.available_status = AvailableStatusEnum.EXPIRED
      return data
    }

    if (data.usage_limit && data.usage_limit === data.usage_count) {
      data.available_status = AvailableStatusEnum.EXPIRED
      return data
    }

    if (data.status === DiscountStatus.DELETED) {
      data.available_status = AvailableStatusEnum.EXPIRED
      return data
    }

    if (userId) {
      if (ids.some((e) => e === data.id)) {
        data.available_status = AvailableStatusEnum.TOOK
        return data
      }
    }
    return data
  }

  async checkAvailable(ruleId: string, userId: string) {
    const udRepo = this.manager_.getCustomRepository(
      this.userDiscountRepository_,
    )
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )
    const data = await discountRepo.findOne({ rule_id: ruleId })

    if (!data) {
      return false
    }

    const tmp = await udRepo.findOne({ user_id: userId, discount_id: data.id })
    if (tmp) {
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

  async getDiscount(id: string, relations?: string[]): Promise<Discount> {
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )
    const query = buildQuery(
      { id, status: DiscountStatus.PUBLISHED },
      { relations: [...defaultGetDiscountsRelations, ...(relations || [])] },
    )
    return await discountRepo.findOne(query)
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
        .where(
          `o.customer_id = '${userId}' AND o.parent_id is null AND o.created_at >= '${dayjs.utc(
            discount.released_at,
            `yyyy-MM-dd'T'HH:mm:ss'.'SSSZ`,
          )}'`,
        )
        .take(1)
        .getCount()

      if (orders > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.REVIEWED) {
      const reviews = await reviewRepo
        .createQueryBuilder('rw')
        .where(
          `rw.user_id = '${userId}' AND rw.created_at >= '${dayjs.utc(
            discount.released_at,
            `yyyy-MM-dd'T'HH:mm:ss'.'SSSZ`,
          )}'`,
        )
        .take(1)
        .getCount()

      if (reviews > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.FAVORITE) {
      const favorites = await favoriteRepo
        .createQueryBuilder('fav')
        .where(
          `fav.user_id = '${userId}' AND fav.created_at >= '${dayjs.utc(
            discount.released_at,
            `yyyy-MM-dd'T'HH:mm:ss'.'SSSZ`,
          )}'`,
        )
        .take(1)
        .getCount()

      if (favorites > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.FOLLOW) {
      const follow = await storeFavoriteRepo
        .createQueryBuilder('sf')
        .where(
          `sf.user_id = '${userId}' AND sf.created_at >= '${dayjs.utc(
            discount.released_at,
            `yyyy-MM-dd'T'HH:mm:ss'.'SSSZ`,
          )}'`,
        )
        .take(1)
        .getCount()

      if (follow > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.MEMBER_REGISTER) {
      const user = await userRepo
        .createQueryBuilder('u')
        .where(
          `u.id = '${userId}' AND u.created_at >= '${dayjs.utc(
            discount.released_at,
            `yyyy-MM-dd'T'HH:mm:ss'.'SSSZ`,
          )}' AND status = '${UserStatus.ACTIVE}'`,
        )
        .take(1)
        .getCount()

      if (user > 0) {
        return true
      }
    }

    if (discount.issuance_timing === IssuanceTimingEnum.NONE) {
      return true
    }
    return false
  }

  async getTotal(type: DiscountType): Promise<number> {
    const discountRepo = this.manager_.getCustomRepository(
      this.discountRepository_,
    )
    const query = buildQuery({ type }, {})
    return await discountRepo.count(query)
  }

  async getCustomerGroupDetail(
    id: string,
    config: FindConfig<CustomerGroupCustomers>,
    discountId?: string,
  ) {
    return await this.atomicPhase_(async (manager) => {
      const customerGroupCustomersRepo: CustomerGroupCustomersRepository =
        manager.getCustomRepository(this.customerGroupCustomersRepository_)

      const query = buildQuery(
        { customer_group_id: id },
        { ...config, relations: ['customer', 'customer_group'] },
      )
      const [customerGroups, count] =
        await customerGroupCustomersRepo.findAndCount(query)

      await Promise.all(
        customerGroups.map(async (e) => {
          let released_at = null
          if (discountId) {
            released_at = await this.getReleasedDate(discountId)
          }
          let used_at = null
          if (discountId) {
            used_at = await this.getUsedDate(e.customer_id, discountId)
          }

          e.released_at = released_at
          e.used_at = used_at
          return e
        }),
      )
      return [customerGroups, count]
    })
  }

  async disableDiscount(id: string) {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepository_)
      const discount = await discountRepo.findOne(id)
      discount.is_disabled = !discount.is_disabled
      return await discountRepo.save(discount)
    })
  }

  async getUsedDate(customerId: string, discountId: string) {
    return await this.atomicPhase_(async (manager) => {
      const udRepo = manager.getCustomRepository(this.userDiscountRepository_)
      const data = await udRepo.findOne({
        user_id: customerId,
        discount_id: discountId,
      })

      if (!data) {
        return null
      }

      return data.created_at
    })
  }

  async getReleasedDate(discountId: string) {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepository_)

      const data = await discountRepo.findOne(discountId)
      if (!data) {
        return null
      }
      return data.released_at
    })
  }

  async delete_(discountId: string) {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepository_)

      return await discountRepo.update(discountId, {
        status: DiscountStatus.DELETED,
      })
    })
  }

  async getListRs(
    selector: Selector<Discount>,
    config: FindConfig<Discount>,
  ): Promise<Discount[]> {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepository_)

      const query = buildQuery(selector, config)
      return await discountRepo.find(query)
    })
  }
}

export const defaultGetDiscountsRelations = [
  'rule',
  'parent_discount',
  'rule.conditions',
  'rule.conditions.product_types',
  'rule.conditions.store_groups',
  'rule.conditions.store_groups.stores',
]
