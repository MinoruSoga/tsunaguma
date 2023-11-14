/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FulfillmentStatus, TransactionBaseService } from '@medusajs/medusa'
import { ProductOptionValueRepository } from '@medusajs/medusa/dist/repositories/product-option-value'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery, isDefined } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import {
  Between,
  Brackets,
  DeepPartial,
  EntityManager,
  In,
  IsNull,
} from 'typeorm'

import loadConfig from '../../../helpers/config'
import { EmailTemplateData } from '../../../interfaces/email-template'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { LineItem } from '../../cart/entity/line-item.entity'
import { NotificationRepository } from '../../notification/repository/notification.repository'
import { Order } from '../../order/entity/order.entity'
import { OrderRepository } from '../../order/repository/order.repository'
import { OrderService } from '../../order/services/order.service'
import StoreRepository from '../../store/repository/store.repository'
import { GetProductReviewsQueryPaginationParams } from '../controllers/product-reviews/product-review-list.admin.controller'
import {
  GetProductReviewStoreParam,
  ProductReviewsStoreParams,
} from '../controllers/product-reviews/product-review-store.admin.controller'
import { UpdateOrderReviewReq } from '../controllers/product-reviews/update-oder-review.admin.controller'
import { Product } from '../entity/product.entity'
import { ProductReviews } from '../entity/product-reviews.entity'
import ProductRepository from '../repository/product.repository'
import { ProductReviewsRepository } from '../repository/product-reviews.repository'
import { NotificationTemplateData } from './../../../interfaces/notification-template'
import { NotificationType } from './../../notification/entities/notification.entity'
import { NotificationSettingService } from './../../notification/services/notification-setting.service'
import { ProductService } from './product.service'

type InjectedDependencies = {
  manager: EntityManager
  eventBusService: EventBusService
  productReviewsRepository: typeof ProductReviewsRepository
  productService: ProductService
  orderRepository: typeof OrderRepository
  orderService: OrderService
  productRepository: typeof ProductRepository
  notificationSettingService: NotificationSettingService
  productOptionValueRepository: typeof ProductOptionValueRepository
  notificationRepository: typeof NotificationRepository
  storeRepository: typeof StoreRepository
  logger: Logger
}

export enum OrderByType {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum SortByColumn {
  RATE = 'rate',
  ORDER = 'order',
}

@Service()
export class ProductReviewsService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'productReviewsService'

  static Events = {
    PRODUCT_REVIEW: 'product_reviews.review',
    REPLY_PRODUCT_REVIEW: 'product_reviews.reply_review',
    REVIEW_MAIL: 'product_reviews.review_mail',
  }

  protected productRepository_: typeof ProductRepository
  protected productReviewsRepo_: typeof ProductReviewsRepository
  protected productService: ProductService
  protected orderRepository: typeof OrderRepository
  protected container: InjectedDependencies
  protected orderService: OrderService
  protected readonly eventBus_: EventBusService
  protected productOptionValueRepo_: typeof ProductOptionValueRepository
  protected notificationSettingService: NotificationSettingService
  protected notificationRepo_: typeof NotificationRepository
  protected storeRepo_: typeof StoreRepository
  private logger_: Logger

  constructor(container: InjectedDependencies) {
    super(container)

    this.container = container
    this.manager_ = container.manager
    this.productReviewsRepo_ = container.productReviewsRepository
    this.productService = container.productService
    this.orderRepository = container.orderRepository
    this.eventBus_ = container.eventBusService
    this.orderService = container.orderService
    this.productRepository_ = container.productRepository
    this.notificationSettingService = container.notificationSettingService
    this.productOptionValueRepo_ = container.productOptionValueRepository
    this.notificationRepo_ = container.notificationRepository
    this.storeRepo_ = container.storeRepository
    this.logger_ = container.logger
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ProductReviewsService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductReviewsService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async reviewsByProduct(
    productId: string,
    selector: Selector<ProductReviews> = {},
    config: FindConfig<ProductReviews> = {},
  ): Promise<[ProductReviews[], number]> {
    selector = Object.assign(selector, { product_id: productId })
    selector.parent_id = null

    const productReviewRepo = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const [rawReviews, count] = await productReviewRepo.findAndCount({
      ...config,
      where: selector,
    })

    return [rawReviews, count]
  }

  async getReviewedProducts(
    userId: string,
    selector: Selector<ProductReviews> = {},
    config: FindConfig<ProductReviews> = {},
  ) {
    //recommend buildQuery
    if (!selector.user_id) {
      selector = Object.assign(selector, { user_id: userId })
    }

    // only review, not include reply
    selector.parent_id = null

    const query = buildQuery(selector, config)

    if (query.order.rate) {
      query.order.created_at = 'DESC'
    }

    const productReviewRepo = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const [rawReviews, count] = await productReviewRepo.findAndCount(query)

    return [rawReviews, count]
  }

  async create(
    productReviewData: ProductReviewsStoreParams,
    loggedInUser: LoggedInUser,
  ) {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const productReviewRepository = transactionManager.getCustomRepository(
          this.productReviewsRepo_,
        )

        const { product_reviews, order_id } = productReviewData

        const orderRepository = transactionManager.getCustomRepository(
          this.orderRepository,
        )
        const order: Order = await orderRepository.findOne(order_id, {
          relations: [
            'items',
            'items.variant',
            'items.shipping_method',
            'items.shipping_method.shipping_option',
            'store',
            'customer',
            'store.owner',
          ],
          where: {
            // status: OrderStatus.PENDING,
            fulfillment_status: FulfillmentStatus.SHIPPED,
          },
        })

        if (!order) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Order with id: ${order_id} was not found`,
          )
        }

        const isProductExistsInOrder: boolean = product_reviews.every(
          (productReview) => {
            return order.items.some((item: LineItem) => {
              return (
                productReview.variant_id === item.variant_id &&
                productReview.product_id === item.variant.product_id
              )
            })
          },
        )

        if (!isProductExistsInOrder) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Product is not included in the order with id: ${order_id}`,
          )
        }

        const isUserPurchases = loggedInUser.id === order.customer_id
        const isUserNotPurchased = product_reviews.every((productReview) => {
          return !productReview.parent_id && !isUserPurchases
        })

        // review: check whether the user has purchased a product or not
        if (isUserNotPurchased) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `The order is not of the user id: ${loggedInUser.id} `,
          )
        }

        const reviews: ProductReviews[] = []
        await Promise.all(
          product_reviews.map(async (productReview) => {
            const result = await this.withTransaction(
              transactionManager,
            ).saveProductReviews(
              productReview,
              loggedInUser,
              productReviewRepository,
              order,
              isUserPurchases,
            )
            reviews.push(result)
          }),
        )

        await this.eventBus_
          .withTransaction(transactionManager)
          .emit(ProductReviewsService.Events.REVIEW_MAIL, {
            id: order.id,
            email: order.store.owner.email,
            format: 'review-complete-shop',
            data: {
              order: order,
              reviews: reviews,
            },
          })

        // Comment out the logic complete order when post review
        // await this.orderService
        //   .withTransaction(transactionManager)
        //   .completeOrder(order_id)

        // send notification to store owner
        const storeOwnerId = order.store.owner_id
        if (storeOwnerId) {
          const isSettingNoti =
            await this.notificationSettingService.checkSetting(
              order.store.owner_id,
              'is_review',
            )

          if (isSettingNoti) {
            const config = loadConfig()
            await this.eventBus_.emit(
              ProductReviewsService.Events.PRODUCT_REVIEW,
              {
                id: storeOwnerId,
                customer_id: storeOwnerId,
                type: NotificationType.NOTIFICATION,
                // @ts-ignore
                message: `${order.customer.nickname}様からレビューが届いています`,
                link: config.frontendUrl.shopDetailReview(order.store_id),
              },
            )
          }
        }
      },
    )
  }

  async listByMe(
    data: GetProductReviewsQueryPaginationParams,
    loggedInUser: LoggedInUser,
  ): Promise<[ProductReviews[], number]> {
    const productReviewRepository = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const userId = loggedInUser.id
    const query = productReviewRepository.createQueryBuilder('product_reviews')
    query.innerJoinAndSelect('product_reviews.order', 'orders')
    query.innerJoinAndSelect('product_reviews.variant', 'variant')
    query.innerJoinAndSelect('product_reviews.product', 'product')
    query.innerJoinAndSelect('product_reviews.user', 'user')
    query.where(
      new Brackets((query) => {
        query.where('product_reviews.user_id = :userId', {
          userId: userId,
        })
      }),
    )
    query.andWhere({ parent_id: null })

    if (data.sort_by === SortByColumn.ORDER) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      query.orderBy('orders.created_at', data.order_by)
    }

    if (data.sort_by === SortByColumn.RATE) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      query.orderBy('product_reviews.rate', data.order_by)
    }

    query.offset(data.offset)
    query.limit(data.limit)

    return await query.getManyAndCount()
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

  async getTotalProductReviewByUser(
    userId: string,
    selector: Selector<ProductReviews>,
    config: FindConfig<ProductReviews>,
  ) {
    const productReviewRepository = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )
    const query = buildQuery({ user_id: userId, parent_id: null }, config)

    if (selector['year'] && selector['month']) {
      const { from, to } = this.getMonth(selector['year'], selector['month'])
      query.where = [
        {
          user_id: userId,
          created_at: Between(from, to),
          parent_id: null,
        },
      ]
    }
    return await productReviewRepository.count(query)
  }

  async getTotalReviews(userId: string) {
    const productReviewRepository = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )
    const query = buildQuery({ user_id: userId, parent_id: null })
    return await productReviewRepository.count(query)
  }

  private async saveProductReviews(
    productReview: GetProductReviewStoreParam,
    loggedInUser: LoggedInUser,
    productReviewRepository: ProductReviewsRepository,
    order: Order,
    isUserPurchases: boolean,
  ): Promise<ProductReviews> {
    const product = (await this.productService.retrieve_({
      id: productReview.product_id,
    })) as Product

    // reply: Check if the user has the right to reply
    if (productReview.parent_id) {
      const isSalesUser = loggedInUser.store_id === product.store_id
      if (!(isUserPurchases || isSalesUser)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `User id: ${loggedInUser.id} does not have permission to reply`,
        )
      }

      const productReviewParent = await productReviewRepository.findOne(
        productReview.parent_id,
      )

      if (!productReviewParent) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product review parent with id: ${productReview.parent_id} was not found `,
        )
      }

      await productReviewRepository.increment(
        { id: productReview.parent_id },
        'reply_cnt',
        1,
      )

      productReview.rate = 5
    }

    delete productReview.product_id

    const createdReview = productReviewRepository.create({
      user_id: loggedInUser.id,
      product_id: product.id,
      order_id: order.id,
      ...productReview,
    })

    const result = await productReviewRepository.save(createdReview)

    return await productReviewRepository.findOne(result.id, {
      relations: ['variant'],
    })
  }

  async getTotalReviewsStore(
    storeId: string,
    selector: Selector<ProductReviews>,
  ) {
    const productReviewRepository = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_,
    )
    let product = await productRepo
      .createQueryBuilder('product')
      .select('product.id')
      .where('store_id = :storeId', { storeId: storeId })
      .getRawMany()
    product = product.map((item) => {
      return item['product_id']
    })

    const query = buildQuery(selector, {} as FindConfig<ProductReviews>)
    query.where = [{ product_id: In(product), parent_id: null }]

    if (selector['year'] && selector['month']) {
      const { from, to } = this.getMonth(selector['year'], selector['month'])
      query.where = [
        {
          product_id: In(product),
          created_at: Between(from, to),
          parent_id: null,
        },
      ]
    }
    const [reviewStores, total] = await productReviewRepository.findAndCount(
      query,
    )
    const rate = _.round(
      reviewStores.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.rate
      }, 0) / total,
      1,
    )

    return { total, rate }
  }

  async getReviewsStore(
    storeId: string,
    selector: Selector<ProductReviews>,
    config: FindConfig<ProductReviews>,
  ) {
    const productReviewRepository = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_,
    )
    let product = await productRepo
      .createQueryBuilder('product')
      .select('product.id')
      .where('store_id = :storeId', { storeId: storeId })
      .getRawMany()
    product = product.map((item) => {
      return item['product_id']
    })

    const query = buildQuery(selector, config)
    query.where = [{ product_id: In(product), parent_id: null }]

    if (query.order.rate) {
      query.order.created_at = 'DESC'
    }

    if (selector['year'] && selector['month']) {
      const { from, to } = this.getMonth(selector['year'], selector['month'])
      query.where = [
        {
          product_id: In(product),
          created_at: Between(from, to),
          parent_id: null,
        },
      ]
    }
    return await productReviewRepository.findAndCount(query)
  }

  // reply review
  async reply(reviewId: string, userId: string, content: string) {
    return this.atomicPhase_(async (tx) => {
      const productReviewRepo = tx.getCustomRepository(this.productReviewsRepo_)

      const review = await productReviewRepo.findOne({
        where: { id: reviewId },
        relations: ['order', 'order.store'],
      })
      if (!review) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Review not found')
      }

      const repliedReview = await productReviewRepo.findOne({
        parent_id: reviewId,
      })

      if (repliedReview) {
        // already replied => update
        repliedReview.content = content
        await productReviewRepo.save(repliedReview)
      } else {
        // not replied yet => create
        const toCreate = productReviewRepo.create({
          user_id: userId,
          content,
          order_id: review.order_id,
          variant_id: review.variant_id,
          product_id: review.product_id,
          parent_id: review.id,
        })

        await productReviewRepo.save(toCreate)
        // update reply count
        await productReviewRepo.update({ id: review.id }, { reply_cnt: 1 })

        // send notification to customer
        const customerId = review.user_id
        if (customerId) {
          const isSettingNoti =
            await this.notificationSettingService.checkSetting(
              customerId,
              'is_review',
            )

          if (isSettingNoti) {
            const config = loadConfig()
            this.eventBus_
              .withTransaction(tx)
              .emit(ProductReviewsService.Events.REPLY_PRODUCT_REVIEW, {
                id: customerId,
                customer_id: customerId,
                type: NotificationType.NOTIFICATION,
                // @ts-ignore
                message: `${review.order.store?.name}さんからレビューの返信が届きました`,
                link: config.frontendUrl.customerReview(review.id),
              })
          }
        }
      }
    })
  }

  // update review of order or reply of a review
  async update(userId: string, data: UpdateOrderReviewReq) {
    return this.atomicPhase_(async (tx) => {
      const productReviewRepo = tx.getCustomRepository(this.productReviewsRepo_)
      const order = await this.orderService
        .withTransaction(tx)
        .retrieve(data.order_id, {
          select: [
            'id',
            // @ts-ignore
            'store_id',
            'customer_id',
            'fulfillment_status',
            'status',
          ],
          relations: ['store'],
        })

      if (
        order.customer_id !== userId ||
        order.fulfillment_status !== FulfillmentStatus.SHIPPED
      ) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
      }

      await Promise.all(
        data.product_reviews.map(async (item) => {
          const toUpdate: DeepPartial<ProductReviews> = {}
          if (isDefined(item.content)) {
            toUpdate.content = item.content
          }

          if (isDefined(item.rate)) {
            toUpdate.rate = item.rate
          }

          await productReviewRepo.update(item.review_id, toUpdate)
        }),
      )
    })
  }

  // get review of an order belongs to an user
  async retrieveByUserAndOrder(userId: string, orderId: string) {
    const productReviewRepo = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const productReview = await productReviewRepo.find({
      where: { user_id: userId, order_id: orderId },
      relations: ['product', 'user', 'variant', 'variant.options'],
    })

    return {
      is_reviewed: productReview?.length > 0,
      data: productReview?.length > 0 ? productReview : null,
    }
  }

  // get reply of review
  async getReviewReply(reviewId: string) {
    const productReviewRepo = this.manager_.getCustomRepository(
      this.productReviewsRepo_,
    )

    const productReview = await productReviewRepo.findOne({
      where: { parent_id: reviewId },
      relations: ['user'],
    })

    return {
      is_replied: !!productReview,
      data: !!productReview ? productReview : null,
    }
  }

  async decorateReview(reviews: ProductReviews[]) {
    const productOptionRepo = this.manager_.getCustomRepository(
      this.productOptionValueRepo_,
    )
    return await Promise.all(
      reviews.map(async (review) => {
        // not populate
        if (!review.variant) {
          return review
        }

        const options = await productOptionRepo.find({
          variant_id: review.variant_id,
        })
        review.variant.options = options

        return review
      }),
    )
  }

  async addLineItemToReview() {
    return this.atomicPhase_(async (tx) => {
      const productReviewRepo = tx.getCustomRepository(this.productReviewsRepo_)

      // not include reply of review
      const reviews = await productReviewRepo.find({ parent_id: IsNull() })
      const map = new Map<string, ProductReviews[]>()

      for (const review of reviews) {
        if (map.has(review.order_id)) {
          map.set(review.order_id, map.get(review.order_id).concat([review]))
        } else {
          map.set(review.order_id, [review])
        }
      }

      for (const [orderId, items] of map.entries()) {
        const order = await this.orderService
          .withTransaction(tx)
          .retrieve(orderId, { relations: ['items'] })

        const blacklist = []

        for (const item of items) {
          const lineItems = order.items.filter(
            (i) =>
              i.variant_id === item.variant_id && !blacklist.includes(i.id),
          )
          if (!lineItems?.length) continue

          await productReviewRepo.update(
            { id: item.id },
            { line_item_id: lineItems[0].id },
          )
          blacklist.push(lineItems[0].id)
        }
      }
    })
  }

  async fixMessages() {
    return this.atomicPhase_(async (tx) => {
      const config = loadConfig()
      const notiRepo = tx.getCustomRepository(this.notificationRepo_)
      const storeRepo = tx.getCustomRepository(this.storeRepo_)

      const notis = await notiRepo.find({
        event_name: ProductReviewsService.Events.PRODUCT_REVIEW,
      })

      for (const noti of notis) {
        if (noti.data.message?.includes('様からレビューが届いています')) {
          const store = await storeRepo.findOne({
            where: { owner_id: noti.customer_id },
          })
          //  old message when review
          if (!store) continue

          let id = store.id
          if (store.is_url_updated) {
            id = store.url
          }

          const link = `${config.frontendUrl.shopDetailReview(id)}`
          const newData = { ...noti.data, link }
          await notiRepo.update({ id: noti.id }, { data: newData })
        } else if (
          noti.data.message?.includes('さんからレビューの返信が届きました')
        ) {
          await notiRepo.update(
            { id: noti.id },
            { event_name: ProductReviewsService.Events.REPLY_PRODUCT_REVIEW },
          )
        }
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

  async genEmailData(
    event: string,
    data: ReviewMailData,
  ): Promise<EmailTemplateData> {
    return {
      to: data.email,
      format: data.format,
      data: data.data,
    }
  }
}

interface ReviewMailData {
  id: string
  format: string
  email: string
  data: object
}
