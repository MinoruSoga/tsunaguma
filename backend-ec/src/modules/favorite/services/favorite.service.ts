import {
  EventBusService,
  PriceSelectionContext,
  PricingService,
  TransactionBaseService,
} from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { Brackets, EntityManager, In, IsNull } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { NotificationType } from '../../notification/entities/notification.entity'
import {
  allowedProductFavoriteStatuses,
  notAllowedProductFavoriteStatuses,
} from '../../product/constant'
import ProductRepository from '../../product/repository/product.repository'
import { ProductService } from '../../product/services/product.service'
import StoreRepository from '../../store/repository/store.repository'
import UserService from '../../user/services/user.service'
import { AddProductFavoriteReq } from '../controllers/add-product-favorite.store.controller'
import { ProductFavoriteByStoreQueryParams } from '../controllers/get-list-favorite-product-by-store.store.controller'
import { ProductFavoriteQueryParams } from '../controllers/product-favorite.store.controller'
import { ProductFavoriteReq } from '../controllers/sync-product-favorite.store.controller'
import { ProductFavorite } from '../entities/product-favorite.entity'
import { StoreFavorite } from '../entities/store-favorite.entity'
import { ProductFavoriteRepository } from '../repository/product-favorite.repository'
import { StoreFavoriteRepository } from '../repository/store-favorite.repository'
import { NotificationTemplateData } from './../../../interfaces/notification-template'
import { NotificationSettingService } from './../../notification/services/notification-setting.service'

export enum OrderByType {
  CREATED_AT_DESC = '-created_at',
  CREATED_AT_ASC = 'created_at',
  PRICE_AT_DESC = '-price',
  PRICE_AT_ASC = 'price',
}

type InjectedDependencies = {
  manager: EntityManager
  productFavoriteRepository: typeof ProductFavoriteRepository
  storeFavoriteRepository: typeof StoreFavoriteRepository
  productRepository: typeof ProductRepository
  storeRepository: typeof StoreRepository
  eventBusService: EventBusService
  notificationSettingService: NotificationSettingService
  userService: UserService
  pricingService: PricingService
}

type FollowStoreInput = {
  store_id: string
  user_id: string
}

@Service()
export class FavoriteService extends TransactionBaseService {
  static resolutionKey = 'favoriteService'
  protected manager_: EntityManager
  protected transactionManager_: EntityManager | undefined
  protected productFavoriteRepository_: typeof ProductFavoriteRepository
  protected storeFavoriteRepository_: typeof StoreFavoriteRepository
  protected productRepository_: typeof ProductRepository
  protected storeRepository_: typeof StoreRepository
  protected notificationSettingService: NotificationSettingService
  protected eventBusService: EventBusService
  protected userService: UserService
  protected pricingService: PricingService

  static Events = {
    FOLLOW_SHOP: 'favorite.follow_shop',
    LIKE_PRODUCT: 'favorite.like_product',
  }

  constructor(private readonly container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.productFavoriteRepository_ = container.productFavoriteRepository
    this.storeFavoriteRepository_ = container.storeFavoriteRepository
    this.productRepository_ = container.productRepository
    this.storeRepository_ = container.storeRepository
    this.notificationSettingService = container.notificationSettingService
    this.eventBusService = container.eventBusService
    this.userService = container.userService
    this.pricingService = container.pricingService
  }

  public async listFavorites(
    data: ProductFavoriteQueryParams,
    userId: string | null,
  ) {
    const proRepo = this.manager_.getCustomRepository(this.productRepository_)

    const take = data.take
    const page = data.page
    const skip = (page - 1) * take
    const orderBy: OrderByType = data.order_by
    const tmpUserId = data.tmp_user_id

    const qb = proRepo
      .createQueryBuilder('product')
      .innerJoinAndSelect(
        'product_favorite',
        'favorite',
        'favorite.product_id = product.id',
      )
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.store', 'store')

    if (userId) {
      qb.where(
        new Brackets((query) => {
          query.where('favorite.user_id = :userId', {
            userId: userId,
          })
        }),
      )
    } else {
      qb.where(
        new Brackets((query) => {
          query.where('favorite.tmp_user_id = :tmpUserId', {
            tmpUserId: tmpUserId,
          })
        }),
      )
    }

    // remove deleted products
    qb.andWhere(
      new Brackets((query) => {
        query.where('product.status not in (:...deleted_statuses)', {
          deleted_statuses: notAllowedProductFavoriteStatuses,
        })
      }),
    )

    if (data.status?.length > 0) {
      if (typeof data.status === 'string') {
        qb.andWhere(
          new Brackets((query) => {
            query.where('product.status = :status', {
              status: data.status,
            })
          }),
        )
      } else {
        qb.andWhere(
          new Brackets((query) => {
            query.where('product.status in (:...status) ', {
              status: data.status,
            })
          }),
        )
      }
    }

    if (data.product_empty) {
      const querySoleOut = new Brackets((query) => {
        if (userId) {
          query.where(
            `favorite.user_id = :userId AND product.is_soldout = true`,
            { userId: userId },
          )
        } else {
          query.where(
            `favorite.tmp_user_id = :tmpUserId AND product.is_soldout = true`,
            { tmpUserId: tmpUserId },
          )
        }
      })
      if (data.status?.length > 0) {
        qb.orWhere(querySoleOut)
      } else {
        qb.andWhere(querySoleOut)
      }
    }
    if (orderBy === OrderByType.CREATED_AT_DESC) {
      qb.orderBy('favorite.created_at', 'DESC')
    } else if (orderBy === OrderByType.CREATED_AT_ASC) {
      qb.orderBy('favorite.created_at', 'ASC')
    }

    const [items, count] = await qb.getManyAndCount()

    const tempPriceContext: PriceSelectionContext = {
      currency_code: JAPANESE_CURRENCY_CODE,
    }

    items.forEach((item) => {
      item.is_liked = true
    })

    const products = await this.pricingService.setProductPrices(
      items,
      tempPriceContext,
    )

    let newProducts = products

    if (orderBy === OrderByType.PRICE_AT_DESC) {
      newProducts = _.orderBy(
        products,
        (i) => i.variants[0]?.prices?.[0]?.amount,
        'desc',
      )
    } else if (orderBy === OrderByType.PRICE_AT_ASC) {
      newProducts = _.orderBy(
        products,
        (i) => i.variants[0]?.prices?.[0]?.amount,
        'asc',
      )
    }

    return { items: [...newProducts.slice(skip, skip + take)], count }
  }

  public async listFavoriteProductByStore(
    selector: Selector<ProductFavorite>,
    config: FindConfig<ProductFavorite>,
    storeId: string,
    data: ProductFavoriteByStoreQueryParams,
  ) {
    const productFavoriteRepo = this.manager_.getCustomRepository(
      this.productFavoriteRepository_,
    )
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository_)

    const store = await storeRepo.findOne(storeId)

    if (!store) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with id ${storeId} not found`,
      )
    }

    delete selector['product_empty']
    delete selector['tmp_user_id']

    const query = buildQuery(selector, config)
    query.where.user_id = store.owner_id

    if (data?.status?.length > 0) {
      query.where = [
        {
          user_id: store.owner_id,
          product: {
            status:
              typeof data?.status === 'string'
                ? data?.status
                : In(data?.status),
          },
        },
        data?.product_empty
          ? {
              user_id: store.owner_id,
              product: {
                is_soldout: true,
                status: In(allowedProductFavoriteStatuses),
              },
            }
          : undefined,
      ].filter((q) => !!q)
    } else {
      if (data?.product_empty) {
        query.where = [
          {
            user_id: store.owner_id,
            product: {
              is_soldout: true,
              status: In(allowedProductFavoriteStatuses),
            },
          },
        ]
      }
    }

    return productFavoriteRepo.findAndCount(query)
  }

  public async listFollowingStoreByStore(
    selector: Selector<StoreFavorite>,
    config: FindConfig<StoreFavorite>,
    storeId: string,
  ) {
    const storeFavoriteRepo = this.manager_.getCustomRepository(
      this.storeFavoriteRepository_,
    )
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository_)

    const store = await storeRepo.findOne(storeId)

    if (!store) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with id ${storeId} not found`,
      )
    }
    delete selector['tmp_user_id']
    const query = buildQuery(selector, config)

    query.where = {
      user_id: store?.owner_id,
    }

    return storeFavoriteRepo.findAndCount(query)
  }

  public async syncFavoriteProduct(
    req: ProductFavoriteReq,
    userId: string | null,
  ): Promise<void> {
    await this.atomicPhase_(async (transactionManager: EntityManager) => {
      const productFavoriteRepo = transactionManager.getCustomRepository(
        this.productFavoriteRepository_,
      )
      const likedProds = await productFavoriteRepo.find({
        tmp_user_id: req.tmp_user_id,
        user_id: IsNull(),
      })
      if (!likedProds || likedProds.length < 1) {
        return
      }
      await productFavoriteRepo.delete({
        user_id: userId,
        product_id: In(likedProds.map((prod) => prod.product_id)),
      })
      await productFavoriteRepo
        .createQueryBuilder()
        .update(ProductFavorite)
        .set({ user_id: userId })
        .where({ tmp_user_id: req.tmp_user_id })
        .andWhere({ user_id: IsNull() })
        .execute()
    })
  }

  public async getStoreFavorite(
    userId: string,
    selector: Selector<StoreFavorite>,
    config: FindConfig<StoreFavorite>,
  ) {
    const storeFavoriteRepo = this.manager_.getCustomRepository(
      this.storeFavoriteRepository_,
    )

    const query = buildQuery(selector, config)
    query.where.user_id = userId
    query.order = {
      updated_at: 'DESC',
    }
    return await storeFavoriteRepo.findAndCount(query)
  }

  public async addProductFavorite(data: AddProductFavoriteReq, userId: string) {
    await this.atomicPhase_(async (manager) => {
      const productFavoriteRepo = manager.getCustomRepository(
        this.productFavoriteRepository_,
      )
      const storeRepo = manager.getCustomRepository(this.storeRepository_)

      const productRepo = manager.getCustomRepository(this.productRepository_)

      const existProduct = userId
        ? await productFavoriteRepo.findOne({
            where: [
              {
                user_id: userId,
                product_id: data.product_id,
              },
            ],
            relations: ['product'],
          })
        : await productFavoriteRepo.findOne({
            where: [
              { tmp_user_id: data.tmp_user_id, product_id: data.product_id },
            ],
            relations: ['product'],
          })

      if (data.is_liked && existProduct) return
      if (!data.is_liked && !existProduct) return

      if (!data.is_liked) {
        await productFavoriteRepo.delete({
          id: existProduct.id,
        })

        await productRepo.increment(
          { id: existProduct.product_id },
          'like_cnt',
          -1,
        )
      } else {
        await productFavoriteRepo.save(
          productFavoriteRepo.create({ ...data, user_id: userId }),
        )
        await productRepo.increment({ id: data.product_id }, 'like_cnt', 1)
        // send notification for shop
        if (!userId) return
        const user = await this.userService.retrieve(userId, {
          select: ['id', 'nickname', 'avatar'],
        })
        const product = await productRepo.findOne(data.product_id, {
          select: ['id', 'store_id'],
        })
        const store = await storeRepo.findOne(product.store_id, {
          select: ['id', 'owner_id'],
        })
        if (!store.owner_id || store.owner_id === userId) return

        const isSettingNoti =
          await this.notificationSettingService.checkSetting(
            store.owner_id,
            'is_favorite',
          )

        if (isSettingNoti) {
          const config = loadConfig()

          // send notification
          await this.eventBusService.emit(FavoriteService.Events.LIKE_PRODUCT, {
            id: store.owner_id,
            customer_id: store.owner_id,
            type: NotificationType.NOTIFICATION,
            message: `${user.nickname}さんがいいねしました`,
            link: config.frontendUrl.productDetail(data.product_id),
            avatar: user.avatar,
          })
        }
      }

      // emit event for meilsearch to update the product
      await this.eventBusService
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, { id: data.product_id })
    })
  }

  async addStore(data: FollowStoreInput) {
    return this.atomicPhase_(async (transactionManager) => {
      const storeFavoriteRepo = transactionManager.getCustomRepository(
        this.storeFavoriteRepository_,
      )
      const storeRepo = transactionManager.getCustomRepository(
        this.storeRepository_,
      )
      const { store_id, user_id } = data

      const store = await storeRepo.findOne(store_id)
      const storeFav = await storeFavoriteRepo.findOne({
        where: { store_id, user_id },
      })
      if (!store)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Store with id ${store_id} not found`,
        )

      if (!storeFav) {
        await storeFavoriteRepo.save(
          storeFavoriteRepo.create({ user_id, store_id }),
        )
        await storeRepo.increment({ id: store_id }, 'follow_cnt', 1)

        // send notification for shop
        const user = await this.userService.retrieve(user_id, {
          select: ['id', 'nickname', 'avatar'],
        })
        const store = await storeRepo.findOne(store_id, {
          select: ['id', 'owner_id'],
        })

        if (!store.owner_id || store.owner_id === user_id) return
        const isSettingNoti =
          await this.notificationSettingService.checkSetting(
            store.owner_id,
            'is_favorite',
          )

        if (isSettingNoti) {
          const config = loadConfig()

          await this.eventBusService.emit(FavoriteService.Events.FOLLOW_SHOP, {
            id: store.owner_id,
            customer_id: store.owner_id,
            type: NotificationType.NOTIFICATION,
            message: `${user.nickname}さんにフォローされました`,
            link: config.frontendUrl.follows('followers-tab'),
            avatar: user.avatar,
          })
        }
      } else {
        await storeFavoriteRepo.remove(storeFav)
        await storeRepo.decrement({ id: store_id }, 'follow_cnt', 1)
      }
    })
  }

  async genNotificationData(
    event: string,
    data: any,
  ): Promise<NotificationTemplateData> {
    return {
      to: data.id,
      data: data,
    }
  }

  async getMyFollowers(
    storeId: string,
    selector: Selector<StoreFavorite>,
    config: FindConfig<StoreFavorite>,
  ) {
    const storeFavoriteRepo = this.manager_.getCustomRepository(
      this.storeFavoriteRepository_,
    )

    const query = buildQuery(selector, config)
    query.where.store_id = storeId
    query.order = {
      updated_at: 'DESC',
    }
    return await storeFavoriteRepo.findAndCount(query)
  }

  public async checkFollow(userId: string, storeId: string): Promise<boolean> {
    const storeFavoriteRepo = this.manager_.getCustomRepository(
      this.storeFavoriteRepository_,
    )
    const storeFav = await storeFavoriteRepo.findOne({
      where: { store_id: storeId, user_id: userId },
    })

    return !!storeFav
  }

  async checkFollowStores(userId: string, ids: string[]) {
    const storeFavoriteRepo = this.manager_.getCustomRepository(
      this.storeFavoriteRepository_,
    )
    const followed = await storeFavoriteRepo.find({
      where: { user_id: userId, store_id: In(ids) },
      select: ['store_id'],
    })

    return followed.map((s) => s.store_id)
  }
}
