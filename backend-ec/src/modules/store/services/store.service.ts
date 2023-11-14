import { CurrencyRepository } from '@medusajs/medusa/dist/repositories/currency'
import { StoreService as MedusaStoreService } from '@medusajs/medusa/dist/services'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { isString } from 'class-validator'
import _ from 'lodash'
import { isDefined, MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import {
  Between,
  DeepPartial,
  EntityManager,
  ILike,
  IsNull,
  LessThanOrEqual,
  Not,
} from 'typeorm'

import {
  FEE_TRANFER,
  MARGIN_RATE_PRM,
  MARGIN_RATE_STD,
  ORDER_COMPLETE_DURATION,
} from '../../../helpers/constant'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import { Order } from '../../order/entity/order.entity'
import { OrderRepository } from '../../order/repository/order.repository'
import { User, UserType } from '../../user/entity/user.entity'
import { CustomerRepository } from '../../user/repository/customer.repository'
import UserRepository from '../../user/user.repository'
import { CreateStoreBillingReq } from '../controllers/profile/create-store-billing.admin.controller'
import { UpdateStoreCMSReq } from '../controllers/profile/update-store.cms.admin.controller'
import { UpdateStoreInformationReq } from '../controllers/profile/update-store-information.admin.controller'
import {
  Store,
  StorePhotoServiceEnum,
  StorePlanType,
  StoreStatus,
} from '../entity/store.entity'
import { StoreBilling, TransferType } from '../entity/store_billing.entity'
import { StoreDetail } from '../entity/store-detail.entity'
import StoreRepository from '../repository/store.repository'
import { StoreBillingRepository } from '../repository/store-billing.repository'
import { StoreDetailRepository } from '../repository/store-detail.repository'
import { StoreFavoriteRepository } from './../../favorite/repository/store-favorite.repository'
import { SeqService } from './../../seq/seq.service'
import { StoreDetailService } from './store-detail.service'

interface ConstructorParams {
  loggedInUser?: User
  manager: EntityManager
  storeRepository: typeof StoreRepository
  storeDetailRepository: typeof StoreDetailRepository
  currencyRepository: typeof CurrencyRepository
  storeBillingRepository: typeof StoreBillingRepository
  eventBusService: EventBusService
  userRepository: typeof UserRepository
  storeDetailService: typeof StoreDetailService
  logger: Logger
  storeFavoriteRepository: typeof StoreFavoriteRepository
  customerRepository: typeof CustomerRepository
  seqService: SeqService
  // productRepository: typeof ProductRepository
  orderRepository: typeof OrderRepository
}

const defaultRelationsOrder = [
  'store',
  'items',
  'region',
  'customer',
  'items.line_item_addons',
  'items.line_item_addons.lv1',
  'items.line_item_addons.lv2',
  'payments',
  'items.tax_lines',
  'items.adjustments',
  'swaps',
  'swaps.additional_items',
  'swaps.additional_items.tax_lines',
  'swaps.additional_items.adjustments',
  'claims',
  'claims.additional_items',
  'claims.additional_items.tax_lines',
  'claims.additional_items.adjustments',
  'discounts',
  'discounts.rule',
  'gift_cards',
  'gift_card_transactions',
  'refunds',
  'shipping_methods',
  'shipping_methods.tax_lines',
  'billing_address',
]

const selectOrder = [
  'id',
  'status',
  'fulfillment_status',
  'payment_status',
  'display_id',
  'cart_id',
  'draft_order_id',
  'customer_id',
  'email',
  'region_id',
  'currency_code',
  'tax_rate',
  'canceled_at',
  'created_at',
  'updated_at',
  'metadata',
  'no_notification',
  'cancel_status',
] as (keyof Order)[]

export class UpdateStoreBillingReq {
  total_origin_price?: number
  total_delivery_price?: number
  total_discount_coupon?: number
  total_fee?: number
  total_discount_campaign?: number
  total_discount_promotion?: number
  total_coupon_used?: number
  total_price?: number
  tax_price?: number
  metadata?: Record<string, unknown>
}

@Service({ scope: 'SCOPED', override: MedusaStoreService })
export default class StoreService
  extends MedusaStoreService
  implements IEmailTemplateDataService
{
  // private readonly productRepo: typeof ProductRepository
  private readonly manager: EntityManager
  private readonly storeRepository: typeof StoreRepository
  private readonly storeDetailRepository: typeof StoreDetailRepository
  private readonly storeBillingRepository: typeof StoreBillingRepository
  private readonly userRepository: typeof UserRepository
  private readonly storeFavoriteRepository: typeof StoreFavoriteRepository
  private logger: Logger
  private readonly storeDetailService: typeof StoreDetailService
  private readonly customerRepository: typeof CustomerRepository
  private evenBus_: EventBusService
  private readonly seqService: SeqService
  private readonly orderRepository: typeof OrderRepository

  static Events = {
    CREATED: 'store.created',
    UPDATED: 'store.updated',
    DELETED: 'store.deleted',
    RETURN_GUARANTEE_COMPLETE: 'store.return_guarantee_complete',
    PHOTO_SERVICE_COMPLETE: 'store.photo_service_complete',
  }

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.manager = container.manager
    this.storeRepository = container.storeRepository
    this.storeDetailRepository = container.storeDetailRepository
    this.storeBillingRepository = container.storeBillingRepository
    this.userRepository = container.userRepository
    this.storeFavoriteRepository = container.storeFavoriteRepository
    this.storeDetailService = container.storeDetailService
    this.seqService = container.seqService
    this.customerRepository = container.customerRepository
    this.evenBus_ = container.eventBusService
    this.logger = container.logger
    // this.productRepo = container.productRepository
    this.orderRepository = container.orderRepository
  }

  async genEmailData(
    event: string,
    data: StoreNotificationData,
  ): Promise<EmailTemplateData> {
    try {
      const storeRepo = this.manager.getCustomRepository(this.storeRepository)
      const store = await storeRepo.findOne(
        {
          id: data.id,
        },
        {
          relations: ['owner', 'store_detail'],
        },
      )
      return {
        to: store.owner.email,
        format: data.format,
        customer_id: store.owner.id,
        data: { store, ...data.data },
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): StoreService {
    if (!transactionManager) {
      return this
    }

    const cloned = new StoreService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async create(): Promise<Store> {
    this.logger.info('Create default store not implemented')
    return null
  }

  // @OnMedusaEntityEvent.Before.Insert(User, { async: true })
  // public async createStoreForNewUser(
  //   params: MedusaEventHandlerParams<User, 'Insert'>,
  // ): Promise<EntityEventType<User, 'Insert'>> {
  //   const { event } = params
  //   let store_id = Object.keys(this.container).includes('loggedInUser')
  //     ? this.container.loggedInUser.store_id
  //     : null
  //   if (!store_id) {
  //     const createdStore = await this.withTransaction(
  //       event.manager,
  //     ).createForUser(event.entity)
  //     if (!!createdStore) {
  //       store_id = createdStore.id
  //     }
  //   }

  //   event.entity.store_id = store_id

  //   return event
  // }

  /**
   * Create a store for a particular user. It mainly used from the event BeforeInsert to create a store
   * for the user that is being inserting.
   * @param user
   */
  public async createForUser(user: User): Promise<Store | void> {
    if (user.store_id) {
      return
    }
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const store = storeRepo.create() as Store
    return storeRepo.save(store)
  }

  /**
   * Return the store that belongs to the authenticated user.
   * @param relations
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async retrieve(
    memberId: string,
    relations: string[] = [],
  ): Promise<Store> {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const store = await storeRepo.findOne({
      relations,
      join: { alias: 'store', innerJoin: { members: 'store.members' } },
      where: (qb) => {
        qb.where('members.id = :memberId', {
          memberId: memberId,
        })
      },
    })

    if (!store) {
      throw new Error('Unable to find the user store')
    }

    return store
  }

  async retrieve_(
    storeId: string,
    config: FindConfig<Store> = {},
    throwIfNotExist = true,
  ): Promise<Store | never> {
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository)

    const query = buildQuery({}, config)

    query.where = [
      {
        id: storeId,
      },
      {
        url: storeId,
      },
    ]

    let store = await storeRepo.findOne(query)

    if (store) {
      return store
    }

    if (!isNaN(Number(storeId))) {
      query.where = [
        {
          id: storeId,
        },
        {
          url: storeId,
        },
        {
          display_id: Number(storeId),
        },
      ]
    }

    store = await storeRepo.findOne(query)

    if (!store && throwIfNotExist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with ${storeId} was not found`,
      )
    }

    return store
  }

  public async retrieveStoreWithOwner(userId: string) {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const store = await storeRepo.findOne({ where: { owner_id: userId } })

    return store
  }

  async retrieveAdmin(
    selector: Selector<Store>,
    config: FindConfig<Store>,
  ): Promise<Store> {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const query = buildQuery(selector, config)
    return await storeRepo.findOne(query)
  }

  /**
   * Saves a given entity in the database with specific transaction manager.
   * If entity does not exist in the database then inserts, otherwise updates.
   */
  public async createStore(data: DeepPartial<Store>): Promise<Store> {
    return this.atomicPhase_(async (transactionManager) => {
      const storeRepo = transactionManager.getCustomRepository(
        this.storeRepository,
      )
      const newStore = storeRepo.create({
        ...data,
        id: data.store_detail_id,
        url: data.url,
      })
      const store = await storeRepo.save(newStore)

      if (newStore.plan_type === StorePlanType.STANDARD) {
        await this.evenBus_
          .withTransaction(transactionManager)
          .emit(StoreService.Events.CREATED, {
            id: store.id,
            format: 'register-store-standard-complete',
          })
      }

      if (newStore.plan_type === StorePlanType.PRIME) {
        await this.evenBus_
          .withTransaction(transactionManager)
          .emit(StoreService.Events.CREATED, {
            id: store.id,
            format: 'register-store-premium-complete',
          })
      }

      return store
    })
  }

  public async setFreeShippingStore(storeId: string, amount: number) {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    await storeRepo
      .createQueryBuilder()
      .update(Store)
      .set({ free_ship_amount: amount })
      .where({ id: storeId })
      .execute()

    await this.evenBus_.emit(StoreService.Events.UPDATED, { id: storeId })
  }

  public async getFreeShippingStore(storeId: string) {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    return await storeRepo
      .createQueryBuilder('store')
      .select(['store.free_ship_amount'])
      .where(' id = :storeId', { storeId: storeId })
      .getOne()
  }

  public async getStoreById(
    selector: Selector<Store> & { user_id?: string },
    config: FindConfig<Store> = {},
    throwIfNotExist = true,
  ) {
    const userId = selector.user_id
    const storeSlug = selector.id
    delete selector.user_id
    delete selector.id
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const query = buildQuery(selector, config)

    query.where = [
      {
        ...(selector || {}),
        id: storeSlug,
      },
      {
        ...(selector || {}),
        url: storeSlug,
      },
    ]

    const store = await storeRepo.findOne(query)
    if (!store && throwIfNotExist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with id: ${storeSlug} was not found`,
      )
    }

    return await this.decorateFollow(store, userId)
  }

  public async getStoreInformation(userId: string): Promise<Store> {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const qb = storeRepo.createQueryBuilder('store')
    qb.where('owner_id = :userId', { userId: userId })
    qb.leftJoinAndSelect('store.store_detail', 'store_detail')

    return await qb.getOne()
  }

  public async updateStoreInformation(
    userId: string,
    data: UpdateStoreInformationReq,
  ): Promise<Store> {
    return this.atomicPhase_(async (transactionManager) => {
      const storeRepo = transactionManager.getCustomRepository(
        this.storeRepository,
      )
      // const prodRepo = transactionManager.getCustomRepository(this.productRepo)

      const store: Store = await storeRepo
        .createQueryBuilder('store')
        .where('owner_id = :userId', { userId: userId })
        .getOne()

      if (!store) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store not found!')
      }

      if (
        data.url &&
        data.url.trim().toLowerCase() !== store.url?.trim().toLowerCase()
      ) {
        // const urlRegex = new RegExp('^[a-z0-9_.-]*$')
        // if (!urlRegex.test(data.url)) {
        //   throw new MedusaError(
        //     MedusaError.Types.INVALID_DATA,
        //     'Url has only characters a->z, 0->9, - and _',
        //   )
        // }

        const storeUrl: Store = await storeRepo
          .createQueryBuilder('store')
          .where('url = :url', { url: data.url })
          .andWhere('owner_id != :userId', {
            userId: userId,
          })
          .getOne()

        if (storeUrl) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'Url already exists',
          )
        }
      }

      const storeDetailRepo = this.manager.getCustomRepository(
        this.storeDetailRepository,
      )

      const storeDetail: StoreDetail = await storeDetailRepo
        .createQueryBuilder('store_detail')
        .where('id = :storeDetailId', {
          storeDetailId: store.store_detail_id,
        })
        .getOne()

      if (!storeDetail) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          'Store Detail not found!',
        )
      }

      if (isDefined(data.avatar)) {
        store.avatar = data.avatar
      }

      if (isDefined(data.intro)) {
        store.intro = data.intro
      }

      if (isDefined(data.name)) {
        store.name = data.name
      }

      if (isDefined(data.about)) {
        store.about = data.about
      }

      if (!!data.photo_service && store.plan_type === StorePlanType.STANDARD) {
        store.photo_service_type = data.photo_service
        store.opt_photo_status = StoreStatus.PENDING
        if (isDefined(data.photo_service_note)) {
          store.photo_service_note = data.photo_service_note
        }
      }

      if (
        data.is_return_guarantee &&
        !store.is_return_guarantee &&
        store.plan_type === StorePlanType.STANDARD &&
        isDefined(data.return_guarantee_note)
      ) {
        store.return_guarantee_note = data.return_guarantee_note
        store.opt_return_status = StoreStatus.PENDING
      }

      if (data.url) {
        store.url = data.url.toString()
      }

      if (data.is_closed && store.plan_type === StorePlanType.STANDARD) {
        // only change shop status
        store.status = StoreStatus.STOPPED
        // store.init_rank = false

        // await prodRepo
        //   .createQueryBuilder()
        //   .update(Product)
        //   .set({
        //     status: ProductStatus.REJECTED,
        //     shop_rank: 0,
        //   })
        //   .where({
        //     store_id: store.id,
        //     status: In([
        //       ProductStatusEnum.proposed,
        //       ProductStatusEnum.published,
        //     ]),
        //   })
        //   .execute()
      } else if (
        isDefined(data.is_closed) &&
        !data.is_closed &&
        store.plan_type === StorePlanType.STANDARD
      ) {
        store.status = StoreStatus.APPROVED
      }

      const res = await storeRepo.save(store)

      const metaData = {
        images: data.images,
        socials: {
          instagram: data.sns_instagram,
          twitter: data.sns_twitter,
          facebook: data.sns_facebook,
        },
      }

      if (!_.isNil(data.web_url)) {
        storeDetail.url = data.web_url.toString()
      }

      storeDetail.metadata = { ...metaData }
      await storeDetailRepo.save(storeDetail)

      store.store_detail = storeDetail

      await this.evenBus_
        .withTransaction(transactionManager)
        .emit(StoreService.Events.UPDATED, res)

      if (
        data.is_return_guarantee &&
        !store.is_return_guarantee &&
        store.plan_type === StorePlanType.STANDARD
      ) {
        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(StoreService.Events.RETURN_GUARANTEE_COMPLETE, {
            id: store.id,
            customer_id: store.owner_id,
            format: 'store-return-guarantee-complete',
            data: {
              contract: {
                note: data.return_guarantee_note,
              },
            },
          })
      }

      if (!!data.photo_service && store.plan_type === StorePlanType.STANDARD) {
        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(StoreService.Events.PHOTO_SERVICE_COMPLETE, {
            id: store.id,
            customer_id: store.owner_id,
            format: 'store-photo-service-complete',
            data: {
              contract: {
                note: data.photo_service_note,
                type: data.photo_service,
              },
            },
          })
      }

      return store
    })
  }

  public async listAndCount(
    selector: Selector<Store>,
    config: FindConfig<Store>,
  ) {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const query = buildQuery(selector, config)

    if (selector?.name) {
      query.where = [
        {
          ...selector,
          name: ILike(`%${selector?.name}%`),
          status: StoreStatus.APPROVED,
        },
      ]
    } else {
      query.where = [
        {
          ...selector,
          status: StoreStatus.APPROVED,
        },
      ]
    }

    return await storeRepo.findAndCount(query)
  }

  public async list(selector: Selector<Store>, config: FindConfig<Store>) {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const query = buildQuery(selector, config)

    return await storeRepo.find(query)
  }

  public async listStoreCms(
    selector: Selector<Store>,
    config: FindConfig<Store>,
  ) {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const query = buildQuery(selector, config)
    query.where.owner_id = Not(IsNull())
    if (query.where.name && isString(query.where.name)) {
      query.where.name = ILike(`%${query.where.name}%`)
    }
    return await storeRepo.findAndCount(query)
  }

  async checkRange(from: number, to: number) {
    if (from !== undefined && to !== undefined) {
      return 'dual'
    } else if (from !== undefined) {
      return 'from'
    } else if (to !== undefined) {
      return 'to'
    }
    return 'none'
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

  async approveStoreReg(id: string) {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const storeRepo = transactionManager.getCustomRepository(
          this.storeRepository,
        )
        const userRepo = transactionManager.getCustomRepository(
          this.userRepository,
        )
        const store = await storeRepo
          .createQueryBuilder('store')
          .where('id = :storeId', { storeId: id })
          .getOne()
        if (!store) {
          throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store not found!')
        }
        const userId = store.owner_id
        const planType = store.plan_type
        const user = await userRepo
          .createQueryBuilder('user')
          .where('id = :userId', { userId: userId })
          .getOne()
        if (!user) {
          throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Owner not found!')
        }

        switch (planType) {
          case StorePlanType.STANDARD:
            user.type = UserType.STORE_STANDARD
            break

          case StorePlanType.PRIME:
            user.type = UserType.STORE_PRIME
            break

          default:
            break
        }

        user.store_id = id
        store.status = StoreStatus.APPROVED
        store.approved_at = new Date()
        await userRepo.save(user)
        const res = await storeRepo.save(store)
        await this.evenBus_.emit(StoreService.Events.UPDATED, res)
        return res
      },
    )
  }

  public async getStoreBillingDetail(userId: string): Promise<StoreBilling> {
    const storeRepo = this.manager.getCustomRepository(this.storeRepository)
    const store = await storeRepo
      .createQueryBuilder('store')
      .where('owner_id = :userId', { userId: userId })
      .getOne()

    if (!store) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store not found!')
    }

    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )
    const storeBilling = await storeBillingRepo
      .createQueryBuilder('store_billing')
      .where('store_id = :storeId', { storeId: store.id })
      .getOne()

    if (!storeBilling) {
      const storeBillingNew: DeepPartial<StoreBilling> = {
        store_id: store.id,
      }

      const storeBillingCreate: StoreBilling = await storeBillingRepo.save(
        storeBillingRepo.create(storeBillingNew),
      )

      return await storeBillingRepo.save(storeBillingCreate)
    }

    return storeBilling
  }

  public async updateStoreBillingTransferType(
    userId: string,
    type: TransferType,
  ): Promise<StoreBilling> {
    const store = await this.manager
      .getCustomRepository(this.storeRepository)
      .createQueryBuilder('store')
      .where('owner_id = :userId', { userId: userId })
      .getOne()

    if (!store) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store not found!')
    }

    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )
    const storeBilling = await storeBillingRepo
      .createQueryBuilder('store_billing')
      .where('store_id = :storeId', { storeId: store.id })
      .getOne()

    if (!storeBilling) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Store billing not found!',
      )
    }

    storeBilling.transfer_type = type
    await storeBillingRepo.save(storeBilling)

    return storeBilling
  }

  public async deleteStore(storeId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      const storeRepo = tx.getCustomRepository(this.storeRepository)
      const store = await storeRepo.findOne({ id: storeId })
      if (!store) {
        return
      }
      await storeRepo.softRemove(store)
      await this.evenBus_
        .withTransaction(tx)
        .emit(StoreService.Events.DELETED, { id: storeId })
    })
  }

  async update_(storeId: string, data: UpdateStoreCMSReq) {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const storeRepo = transactionManager.getCustomRepository(
          this.storeRepository_,
        )
        const store = await this.retrieve_(storeId)

        const update: DeepPartial<Store> = Object.assign(store, {
          ...data,
        })

        if (data.plan_type === StorePlanType.PRIME) {
          data.margin_rate
            ? (update.margin_rate = data.margin_rate)
            : (update.margin_rate = MARGIN_RATE_PRM)

          data.has_photo_service === true
            ? (update.photo_service_type = StorePhotoServiceEnum.BASIC)
            : ''

          update.is_return_guarantee = true
          update.has_photo_service = true
        } else {
          // check approve return guarantee
          if (update.is_return_guarantee) {
            update.opt_return_status = StoreStatus.APPROVED
          }

          // check approve photo service
          if (update.has_photo_service) {
            update.opt_photo_status = StoreStatus.APPROVED
          }
          data.margin_rate
            ? (update.margin_rate = data.margin_rate)
            : (update.margin_rate = MARGIN_RATE_STD)
        }

        data.spec_starts_at === undefined ? (update.spec_starts_at = null) : ''
        data.spec_ends_at === undefined ? (update.spec_ends_at = null) : ''

        await storeRepo.save(update)

        const result = await this.retrieve_(storeId)
        await this.evenBus_.emit(StoreService.Events.UPDATED, result)
        return result
      },
    )
  }

  async decorateFollow(store: Store, userId?: string) {
    const cusRepo = this.manager.getCustomRepository(this.customerRepository)

    if (!store) {
      return store
    }

    if (store.owner_id) {
      const customer = await cusRepo.findOne(store.owner_id)
      if (customer) {
        store.owner_display_id = customer.display_id
      }
    } else {
      store.owner_display_id = null
    }

    if (!userId) {
      // not logged in
      store.is_followed = false
      return store
    }

    const storeFavoriteRepo = this.manager.getCustomRepository(
      this.storeFavoriteRepository,
    )

    const storeFav = await storeFavoriteRepo.findOne({
      store_id: store.id,
      user_id: userId,
    })

    store.is_followed = !!storeFav

    return store
  }

  async resetNewTransaction(id: string) {
    return this.atomicPhase_(async (transactionManager) => {
      const storeRepo = transactionManager.getCustomRepository(
        this.storeRepository,
      )

      await this.seqService.resetSeq(`store_new_transaction_cnt_${id}`)
      await storeRepo.update(id, { new_transaction_cnt: 0 })
    })
  }

  public async getStoreBilling(storeId: string): Promise<StoreBilling> {
    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )

    const date = new Date()
    const month = date.getMonth().toString()
    const year = date.getFullYear().toString()

    const { from, to } = this.getRangeTime(year, month)

    const selector: Selector<StoreBilling> = {
      store_id: storeId,
      created_at: Between(from, to),
    }

    const config: FindConfig<StoreBilling> = {}
    const query = buildQuery(selector, config)

    const storeBilling = await storeBillingRepo.findOne(query)

    return storeBilling
  }

  public async createdStoreBilling(
    storeId: string,
    data: CreateStoreBillingReq,
  ): Promise<StoreBilling> {
    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )

    const storeBilling = await this.getStoreBilling(storeId)
    data.total_price = data.total_price - FEE_TRANFER

    if (!storeBilling) {
      const storeBillingNew: DeepPartial<StoreBilling> = {
        store_id: storeId,
        ...data,
      }

      const storeBillingCreate: StoreBilling = await storeBillingRepo.save(
        storeBillingRepo.create(storeBillingNew),
      )

      return await storeBillingRepo.save(storeBillingCreate)
    }

    return storeBilling
  }

  public async updateStoreBilling(
    billingId: string,
    data: UpdateStoreBillingReq,
  ) {
    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )

    const storeBilling = await storeBillingRepo.findOne(billingId)

    return await storeBillingRepo.save({ ...storeBilling, ...data })
  }

  async getBillingExist(storeId: string) {
    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )

    const selector: Selector<StoreBilling> = {
      store_id: storeId,
    }

    const config: FindConfig<StoreBilling> = {
      take: 1,
      order: { created_at: 'DESC' },
    }

    const query = buildQuery(selector, config)
    return await storeBillingRepo.findOne(query)
  }

  public async getStoreBillingHistory(
    storeId: string,
    limit: number,
    offset: number,
  ) {
    const storeBillingRepo = this.manager.getCustomRepository(
      this.storeBillingRepository,
    )

    const orderRepo = this.manager.getCustomRepository(this.orderRepository)

    const selector: Selector<StoreBilling> = {
      store_id: storeId,
    }

    const config: FindConfig<StoreBilling> = {
      take: 2,
      order: { created_at: 'DESC' },
    }

    const query = buildQuery(selector, config)

    const storeBilling = await storeBillingRepo.find(query)

    if (storeBilling.length === 0) {
      return {
        billing: undefined,
        orders: [],
        count: 0,
      }
    }

    let from = ''
    let to = ''
    if (storeBilling.length === 1) {
      const temp = storeBilling[0].created_at
      const tMonth = temp.getMonth()
      const tYear = temp.getFullYear()

      const toDate = new Date()
      toDate.setUTCMonth(tMonth + 1, 0)
      toDate.setUTCFullYear(tYear)

      const rTo = new Date(toDate.getTime() - ORDER_COMPLETE_DURATION)

      to = rTo.toISOString()
    } else {
      const tTo = storeBilling[0].created_at
      const tFrom = storeBilling[1].created_at

      const tTMonth = tTo.getMonth()
      const tFMonth = tFrom.getMonth()

      const tTYear = tTo.getFullYear()
      const tFYear = tFrom.getFullYear()

      const toDate = new Date()
      toDate.setUTCMonth(tTMonth + 1, 0)
      toDate.setUTCFullYear(tTYear)

      const rTo = new Date(toDate.getTime() - ORDER_COMPLETE_DURATION)

      to = rTo.toISOString()

      const fromDate = new Date()
      fromDate.setUTCMonth(tFMonth + 1, 1)
      fromDate.setUTCFullYear(tFYear)

      const rFrom = new Date(fromDate.getTime() - ORDER_COMPLETE_DURATION)

      from = rFrom.toISOString()
    }

    if (from !== '' && to !== '') {
      const selector: Selector<Order> = {}
      const config: FindConfig<Order> = {}

      const query = buildQuery(selector, config)
      query.relations = defaultRelationsOrder
      query.select = selectOrder
      query.where = [
        {
          store_id: storeId,
          parent_id: Not(IsNull()),
          shipped_at: Between(from, to),
          fulfillment_status: 'shipped',
          status: 'completed',
        },
      ]
      query.order = { created_at: 'DESC' }
      query.take = limit
      query.skip = offset

      const [orders, count] = await orderRepo.findAndCount(query)
      return { billing: storeBilling[0], orders, count: count }
    } else {
      if (to !== '') {
        const selector: Selector<Order> = {}
        const config: FindConfig<Order> = {}

        const query = buildQuery(selector, config)
        query.relations = defaultRelationsOrder
        query.select = selectOrder
        query.where = [
          {
            store_id: storeId,
            parent_id: Not(IsNull()),
            shipped_at: LessThanOrEqual(to),
            fulfillment_status: 'shipped',
            status: 'completed',
          },
        ]
        query.order = { created_at: 'DESC' }
        query.take = limit
        query.skip = offset

        const [orders, count] = await orderRepo.findAndCount(query)
        return { billing: storeBilling[0], orders, count: count }
      }
    }
  }

  protected getRangeTime(year: string, month: string) {
    const years = Number(year)
    const months = Number(month)

    const fromDate = new Date()

    fromDate.setUTCMonth(months, 1)
    fromDate.setUTCFullYear(years)
    fromDate.setUTCHours(0, 0, 0, 1)

    const toDate = new Date()

    toDate.setUTCFullYear(years)
    toDate.setUTCMonth(months + 1, 0)
    toDate.setUTCHours(23, 59, 59, 999)

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    }
  }

  async changeStatus(
    storeId: string,
    status: StoreStatus,
    resetRank = false,
    saveOldStatus = false,
  ) {
    return this.atomicPhase_(async (tx) => {
      const storeRepo = tx.getCustomRepository(this.storeRepository)

      const store = await storeRepo.findOne({ id: storeId })

      if (saveOldStatus) {
        store.old_status = store.status
      }

      store.status = status
      if (resetRank) {
        store.init_rank = false
      }

      await storeRepo.save(store)
      await this.evenBus_
        .withTransaction(tx)
        .emit(StoreService.Events.UPDATED, { id: storeId })
    })
  }
}

interface StoreNotificationData {
  storeId: string
  id: string
  format: string
  data?: object
}
