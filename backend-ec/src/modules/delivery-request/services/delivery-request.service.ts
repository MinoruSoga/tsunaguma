/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  EventBusService,
  ProductStatus,
  TransactionBaseService,
} from '@medusajs/medusa'
import { ProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import {
  ExtendedFindConfig,
  FindConfig,
  Selector,
} from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { isDefined, MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, In, IsNull, Not } from 'typeorm'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import { ExtendedAdminPostProductVariantsReq } from '../../product/controllers/create-product.admin.controller'
import { ProductStatusEnum } from '../../product/entity/product.entity'
import ProductRepository from '../../product/repository/product.repository'
import { ProductService } from '../../product/services/product.service'
import { ProductVariantService } from '../../product/services/product-variant.service'
import { ShippingProfileService } from '../../shipping/services/shipping-profile.service'
import { AddDeliveryStockReq } from '../controllers/add-stock-delivery-request.admin.controller'
import { PostDeliveryRequestReq } from '../controllers/created-delivery-request.admin.controller'
import {
  DeliveryReqChildrenRes,
  DeliveryReqDetailRes,
} from '../controllers/get-delivery-request-detail.cms.admin.controller'
import { PutDeliveryRequestReq } from '../controllers/update-delivery-request.admin.controller'
import {
  DeliveryRequest,
  DeliveryRequestAdminStatus,
  DeliveryRequestStatus,
} from '../entities/delivery-request.entity'
import { DeliveryRequestRepository } from '../repository/delivery-request.repository'
import { DeliveryRequestVariantRepository } from '../repository/delivery-request-variant.repository'

type InjectionDependencies = {
  manager: EntityManager
  logger: Logger
  deliveryRequestRepository: typeof DeliveryRequestRepository
  productService: ProductService
  productVariantService: ProductVariantService
  eventBusService: EventBusService
  shippingProfileService: ShippingProfileService
  productRepository: typeof ProductRepository
  deliveryRequestVariantRepository: typeof DeliveryRequestVariantRepository
  productVariantRepository: typeof ProductVariantRepository
}

@Service()
export default class DeliveryRequestService
  extends TransactionBaseService
  implements IEmailTemplateDataService
{
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected deliveryRequestRepo_: typeof DeliveryRequestRepository
  protected productService_: ProductService
  protected productVariantService_: ProductVariantService
  protected shippingProfileService_: ShippingProfileService
  protected productRepo_: typeof ProductRepository
  protected deliveryRequestVariantRepo_: typeof DeliveryRequestVariantRepository
  protected productVariantRepo_: typeof ProductVariantRepository

  static resolutionKey = 'deliveryRequestService'
  static Events = {
    CREATE: 'delivery_request.created',
    UPDATE: 'delivery_request.updated',
    DELETE: 'delivery_request.deleted',
    CANCELED: 'delivery_request.canceled',
    DELIVERED: 'delivery_request.delivered',
    SEND_MAIL: 'delivery_request.send_mail',
    QUANTITY_CONFIRM: 'delivery_request.quantity_confirm',
    ARRIVED: 'delivery_request.arrived',
    PUBLISHED: 'delivery_request.published',
  }

  private eventBus_: EventBusService
  private logger_: Logger

  constructor(container: InjectionDependencies) {
    super(container)
    this.manager_ = container.manager
    this.transactionManager_ = container.manager
    this.logger_ = container.logger
    this.deliveryRequestRepo_ = container.deliveryRequestRepository
    this.productService_ = container.productService
    this.productVariantService_ = container.productVariantService
    this.shippingProfileService_ = container.shippingProfileService
    this.eventBus_ = container.eventBusService
    this.deliveryRequestVariantRepo_ =
      container.deliveryRequestVariantRepository
    this.productVariantRepo_ = container.productVariantRepository
    this.productRepo_ = container.productRepository
  }

  /**
   * Gets a delivery request by selector.
   * Throws in case of DB Error and if delivery request was not found.
   * @param selector - selector object
   * @param config - object that defines what should be included in the
   *   query response
   * @return the result of the find one operation.
   */
  async retrieve(
    selector: Selector<DeliveryRequest> = {},
    config: FindConfig<DeliveryRequest> = {},
  ): Promise<DeliveryRequest> {
    const manager = this.manager_
    const deliverRequestRepo = manager.getCustomRepository(
      this.deliveryRequestRepo_,
    )
    const deliverRequestVariantRepo = manager.getCustomRepository(
      this.deliveryRequestVariantRepo_,
    )

    if (!selector.status) {
      selector.status = Not(DeliveryRequestStatus.DELETED)
    }

    const pickVariantIdx = config.relations?.findIndex(
      (x) => x === 'product.variants_pick',
    )

    if (pickVariantIdx >= 0) {
      config.relations[pickVariantIdx] = 'product.variants'
    }

    const pickChildrenVariantIdx = config.relations?.findIndex(
      (x) => x === 'children.product.variants_pick',
    )
    if (pickChildrenVariantIdx >= 0) {
      config.relations[pickChildrenVariantIdx] = 'children.product.variants'
    }

    const query = buildQuery(selector, config)

    const deliveryRequest = await deliverRequestRepo.findOne(query)

    if (!deliveryRequest) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Delivery request was not found`,
      )
    }

    if (pickVariantIdx >= 0 && deliveryRequest.product?.variants) {
      const variants = (
        await deliverRequestVariantRepo.find({
          where: { delivery_request_id: deliveryRequest.id },
          select: ['variant_id'],
        })
      ).map((d) => d.variant_id)

      deliveryRequest.product.variants =
        deliveryRequest.product.variants.filter((d) => variants.includes(d.id))
    }

    if (pickChildrenVariantIdx >= 0 && deliveryRequest.children?.length) {
      for (const d of deliveryRequest.children) {
        const variants = (
          await deliverRequestVariantRepo.find({
            where: { delivery_request_id: d.id },
            select: ['variant_id'],
          })
        ).map((_d) => _d.variant_id)

        if (d.product.variants) {
          d.product.variants = d.product.variants.filter((v) =>
            variants.includes(v.id),
          )
        }
      }
    }

    return deliveryRequest
  }

  /**
   * Create a new delivery request or copy from an existing one
   * @param data - data to create new delivery request
   * @param storeId - Id if stores that new delivery request belongs to
   * @param parentId - Delivery from which new delivery request is created
   * @return newly created delivery request
   */
  async create(
    data: Partial<PostDeliveryRequestReq> & {
      user_id?: string
      rank?: number
      admin_status?: DeliveryRequestAdminStatus
    },
    storeId: string,
    parentId?: string,
  ): Promise<DeliveryRequest> {
    return this.atomicPhase_(async (tx) => {
      const { user_id: userId, product, ...rest } = data

      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )

      // get admin status
      switch (rest.status) {
        case DeliveryRequestStatus.DRAFT:
          rest.admin_status = DeliveryRequestAdminStatus.DRAFT
          break
        case DeliveryRequestStatus.PENDING:
          rest.admin_status = DeliveryRequestAdminStatus.NEW_REQUEST
          break
        default:
          rest.admin_status = null
          break
      }

      const toCreate = deliveryRequestRepo.create(rest)
      toCreate.store_id = storeId

      if (isDefined(parentId)) {
        toCreate.parent_id = parentId
      }

      if (toCreate.status === DeliveryRequestStatus.PENDING) {
        toCreate.released_at = new Date()
      }

      const result = await deliveryRequestRepo.save(toCreate)

      if (product) {
        // create product of product of delivery request
        // @ts-ignore
        product.status = ProductStatusEnum.delivery_request
        product.store_id = storeId

        // Get default shipping profile
        const shippingProfile = await this.shippingProfileService_
          .withTransaction(tx)
          .retrieveDefault(storeId)

        const { variants } = product
        delete product.variants
        const newProduct = await this.productService_
          .withTransaction(tx)
          .create(
            { ...(product as any), profile_id: shippingProfile.id },
            userId,
          )

        result.product_id = newProduct.id
        // add total stock of all variants
        result.total_stock = (variants || []).reduce(
          (acc, v) => acc + v.inventory_quantity,
          0,
        )

        // create product variants
        if (variants?.length) {
          // create variants here
          for (const [i, variant] of variants.entries()) {
            variant['variant_rank'] = i
          }

          await Promise.all(
            variants.map(async (v) => {
              // retrieve the delivery_quantity and overide delivery_quantity to 0
              const deliveryQuantity = v.inventory_quantity || 0
              v.inventory_quantity = 0

              const variant = {
                ...v,
                options: [],
                prices: [
                  {
                    currency_code: JAPANESE_CURRENCY_CODE,
                    amount: data.suggested_price || 0,
                  },
                ],
              }

              const newVariant = await this.productVariantService_
                .withTransaction(tx)
                .create(
                  newProduct.id,
                  variant as ExtendedAdminPostProductVariantsReq,
                )

              await deliveryRequestVariantRepo.save(
                deliveryRequestVariantRepo.create({
                  delivery_request_id: result.id,
                  variant_id: newVariant.id,
                  delivery_quantity: deliveryQuantity,
                }),
              )
            }),
          )
        }

        await deliveryRequestRepo.save(result)
      }

      await this.eventBus_
        .withTransaction(tx)
        .emit(DeliveryRequestService.Events.CREATE, { id: result.id })

      const cleanRes = await this.withTransaction(tx).retrieve({
        id: result.id,
      })

      return cleanRes
    })
  }

  async create_(
    data: Partial<PostDeliveryRequestReq> & {
      user_id?: string
      rank?: number
      admin_status?: DeliveryRequestAdminStatus
    },
    storeId: string,
    parentId?: string,
  ) {
    return this.atomicPhase_(async (tx) => {
      const { user_id: userId, product, ...rest } = data

      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )

      switch (rest.status) {
        case DeliveryRequestStatus.DRAFT:
          rest.admin_status = DeliveryRequestAdminStatus.DRAFT
          break
        case DeliveryRequestStatus.PENDING:
          rest.admin_status = DeliveryRequestAdminStatus.NEW_REQUEST
          break
        default:
          rest.admin_status = null
          break
      }

      const toCreate = deliveryRequestRepo.create(rest)
      toCreate.store_id = storeId

      if (isDefined(parentId)) {
        toCreate.parent_id = parentId
      }

      if (toCreate.status === DeliveryRequestStatus.PENDING) {
        toCreate.released_at = new Date()
      }

      const result = await deliveryRequestRepo.save(toCreate)

      if (product) {
        // create product of product of delivery request
        // @ts-ignore
        product.status = ProductStatusEnum.delivery_request
        product.store_id = storeId

        // Get default shipping profile
        const shippingProfile = await this.shippingProfileService_
          .withTransaction(tx)
          .retrieveDefault(storeId)

        const { variants } = product
        delete product.variants
        const newProduct = await this.productService_
          .withTransaction(tx)
          .create(
            { ...(product as any), profile_id: shippingProfile.id },
            userId,
          )

        result.product_id = newProduct.id
        // add total stock of all variants
        result.total_stock = (variants || []).reduce(
          (acc, v) => acc + v.inventory_quantity,
          0,
        )

        // create product variants
        if (variants?.length) {
          // create variants here
          for (const [i, variant] of variants.entries()) {
            variant['variant_rank'] = i
          }

          await Promise.all(
            variants.map(async (v) => {
              // retrieve the delivery_quantity and overide delivery_quantity to 0
              const deliveryQuantity = v.inventory_quantity || 0
              v.inventory_quantity = 0

              const variant = {
                ...v,
                options: [],
                prices: [
                  {
                    currency_code: JAPANESE_CURRENCY_CODE,
                    amount: data.suggested_price || 0,
                  },
                ],
              }

              const newVariant = await this.productVariantService_
                .withTransaction(tx)
                .create(
                  newProduct.id,
                  variant as ExtendedAdminPostProductVariantsReq,
                )

              await deliveryRequestVariantRepo.save(
                deliveryRequestVariantRepo.create({
                  delivery_request_id: result.id,
                  variant_id: newVariant.id,
                  delivery_quantity: deliveryQuantity,
                  different_quantity: v.different_quantity,
                  different_quantity_flag: v.different_quantity_flag,
                }),
              )
            }),
          )
        }

        await deliveryRequestRepo.save(result)
      }

      await this.eventBus_
        .withTransaction(tx)
        .emit(DeliveryRequestService.Events.CREATE, { id: result.id })
    })
  }

  /**
   *
   * @param id Id of delivery request needs to update
   * @param data Data to update delivery request
   * @returns DeliveryRequest
   */
  async update(
    id: string,
    data: PutDeliveryRequestReq & { user_id?: string; rank?: number },
  ): Promise<DeliveryRequest> {
    return this.manager_.transaction(async (tx) => {
      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )
      const productVariantRepo = tx.getCustomRepository(
        this.productVariantRepo_,
      )
      const productRepo_ = tx.getCustomRepository(this.productRepo_)

      let deliveryRequest = await this.retrieve({
        id,
        status: Not(DeliveryRequestStatus.DELETED),
      })
      const { user_id, product, ...rest } = data
      const variants = product?.variants

      // update delivery request
      const toUpdate: Partial<DeliveryRequest> = {
        ...deliveryRequest,
        ...rest,
      }

      if (isDefined(variants)) {
        toUpdate.total_stock = variants.reduce(
          (acc, v) => acc + v.inventory_quantity,
          0,
        )
      }

      // check if status from draft to pending
      if (!deliveryRequest.admin_status) {
        toUpdate.admin_status = DeliveryRequestAdminStatus.DRAFT
      }
      if (
        rest.status === DeliveryRequestStatus.PENDING &&
        deliveryRequest.status === DeliveryRequestStatus.DRAFT
      ) {
        toUpdate.created_at = new Date()
        toUpdate.admin_status = DeliveryRequestAdminStatus.NEW_REQUEST
      }

      if (
        rest.status === DeliveryRequestStatus.PENDING &&
        !deliveryRequest.released_at
      ) {
        toUpdate.released_at = new Date()
      }

      if (rest.status === DeliveryRequestStatus.PENDING) {
        toUpdate.admin_status = DeliveryRequestAdminStatus.NEW_REQUEST
      }

      if (rest.admin_status === DeliveryRequestAdminStatus.ARRIVED) {
        toUpdate.status = DeliveryRequestStatus.DELIVERED
      }

      deliveryRequest = await deliveryRequestRepo.save(toUpdate)
      const isUpdateVariants = isDefined(variants)

      // update product of delivery request if exist
      if (product) {
        const prod = await productRepo_.findOne(deliveryRequest.product_id, {
          select: ['status'],
        })

        if (rest.admin_status === DeliveryRequestAdminStatus.ARRIVED) {
          product.status = ProductStatus.DRAFT
        } else {
          product.status = prod.status
        }
        delete product.variants
        await this.productService_
          .withTransaction(tx)
          .update(deliveryRequest.product_id, product as any, user_id)

        // re-create delivery_request_variant records of newly updated variants
        if (isUpdateVariants) {
          // remove all old records of in delivery_request_variant table of this delivery request
          await deliveryRequestVariantRepo.delete({ delivery_request_id: id })

          const oldVariants = await this.productVariantService_
            .withTransaction(tx)
            .list(
              { product_id: deliveryRequest.product_id },
              { select: ['id'] },
            )
          // deleted variants
          const deletedVariants = oldVariants.filter(
            (item) => !variants.find((_v) => _v.id && _v.id === item.id),
          )
          await productVariantRepo.remove(deletedVariants)

          await Promise.all(
            variants.map(async (v) => {
              let variantId: string
              if (v.id) {
                // update stock
                variantId = v.id

                const oldVariant = oldVariants.find((i) => i.id === v.id)
                if (!oldVariant) return

                // omit inventory quantity => prevent overide inventory quantity
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { inventory_quantity, id, ...rest } = v
                const toUpdate: ExtendedAdminPostProductVariantsReq = {
                  ...rest,
                  inventory_quantity: oldVariant.inventory_quantity,
                  prices: [
                    {
                      currency_code: JAPANESE_CURRENCY_CODE,
                      amount: deliveryRequest.suggested_price || 0,
                    },
                  ],
                }

                // update variant
                await this.productVariantService_
                  .withTransaction(tx)
                  .update(v.id, toUpdate)
              } else {
                // create new variant
                const variant = {
                  ...v,
                  options: [],
                  prices: [
                    {
                      currency_code: JAPANESE_CURRENCY_CODE,
                      amount: deliveryRequest.suggested_price || 0,
                    },
                  ],
                  variant_rank: 0,
                  inventory_quantity: 0,
                }

                const newVariant = await this.productVariantService_
                  .withTransaction(tx)
                  .create(
                    deliveryRequest.product_id,
                    variant as ExtendedAdminPostProductVariantsReq,
                  )
                variantId = newVariant.id
              }

              await deliveryRequestVariantRepo.save(
                deliveryRequestVariantRepo.create({
                  delivery_request_id: id,
                  variant_id: variantId,
                  delivery_quantity: v.inventory_quantity,
                  different_quantity: v.different_quantity,
                  different_quantity_flag: v.different_quantity_flag,
                }),
              )
            }),
          )
        }
      }

      return deliveryRequest
    })
  }

  /**
   * Lists delivery requests based on the provided parameters and includes the count of
   * delivery requests that match the query.
   * @param selector - an object that defines rules to filter delivery requests
   *   by
   * @param config - object that defines the scope for what should be
   *   returned
   * @return an array containing the delivery requests as
   *   the first element and the total count of delivery requests that matches the query
   *   as the second element.
   */
  async listAndCount(
    selector: Selector<Omit<DeliveryRequest, 'status'>> & {
      q?: string
      status?: string
    },
    config: FindConfig<DeliveryRequest>,
  ): Promise<[DeliveryRequest[], number]> {
    const deliveryRequestRepo = this.manager_.getCustomRepository(
      this.deliveryRequestRepo_,
    )

    const query = buildQuery(
      {
        parent_id: IsNull(),
        store_id: selector.store_id,
      },
      {
        ...config,
        relations: [
          'children',
          'children.product',
          'children.product.variants',
        ],
        order: { created_at: 'DESC' },
      },
    ) as ExtendedFindConfig<DeliveryRequest, Selector<DeliveryRequest>>

    let count = 0
    let ids1 = []
    if (selector.status) {
      const statuses = selector.status.split(',') as DeliveryRequestStatus[]
      ids1 = [
        ...new Set(
          await this.getListIdsByStatus(selector.store_id as string, statuses),
        ),
      ]
      count++
    } else {
      ids1 = [
        ...new Set(await this.getListIdsByStatus(selector.store_id as string)),
      ]
      count++
    }

    let ids2 = []
    if (!_.isNil(selector.q)) {
      ids2 = [
        ...new Set(
          await this.getListIdsByTitle(selector.q, selector.store_id as string),
        ),
      ]
      count++
    }

    const ids = [].concat(ids1, ids2)
    const idss = _.countBy(ids)

    const listIds = []
    for (const key in idss) {
      if (idss[key] === count) {
        listIds.push(key)
      }
    }

    query.where.id = In(listIds)

    return await deliveryRequestRepo.findAndCount(query)
  }

  async getListIdsByStatus(storeId: string, status?: string[]) {
    return this.atomicPhase_(async (tx) => {
      const deliverRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )

      const selector: Selector<DeliveryRequest> = {
        store_id: storeId,
        parent_id: Not(IsNull()),
      }
      const config: FindConfig<DeliveryRequest> = {
        select: ['parent_id'],
      }
      const query = buildQuery(selector, config)

      if (status?.length > 0) {
        query.where.status = In(status)
      } else {
        query.where.status = Not(DeliveryRequestStatus.DELETED)
      }

      const result = await deliverRequestRepo.find(query)

      return result.map((e) => e['parent_id'])
    })
  }

  async getListIdsByTitle(title: string, storeId: string) {
    return this.atomicPhase_(async (tx) => {
      const deliverRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )
      const qb = deliverRequestRepo
        .createQueryBuilder('dr')
        .innerJoin('dr.product', 'pro', 'pro.id = dr.product_id')
        .select('dr.parent_id')
        .distinct(true)
        .where('lower(pro.title) LIKE :title', {
          title: `%${title.toLocaleLowerCase()}%`,
        })
        .andWhere('dr.status <> :status', {
          status: DeliveryRequestStatus.DELETED,
        })
        .andWhere('dr.parent_id is not null')
        .andWhere('dr.store_id = :storeId', { storeId })

      const result = await qb.getMany()

      return result.map((e) => e['parent_id'])
    })
  }

  /**
   * Lists delivery products based on the provided parameters
   * @param selector - an object that defines rules to filter delivery products
   *   by
   * @param config - object that defines the scope for what should be
   *   returned
   * @return an array containing the products as
   *   the first element and the total count of products that matches the query
   *   as the second element.
   */
  async listProductsAndCount(status: string, store_id: string) {
    const deliveryRequestRepo = this.manager_.getCustomRepository(
      this.deliveryRequestRepo_,
    )

    const data = status.split(',')
    const qb = deliveryRequestRepo
      .createQueryBuilder('dr2')
      .select(['dr2.id as delivery_id', 'p.title as title'])
      .innerJoin(
        (subQuery) => {
          return subQuery
            .select('dr.product_id, MAX(dr.created_at) as MaxTime')
            .from(DeliveryRequest, 'dr')
            .where(
              data.length > 0
                ? `dr.product_id is not null AND dr.status IN (:...status)`
                : `dr.product_id is not null`,
              { status: data },
            )
            .groupBy('dr.product_id')
        },
        'r',
        'dr2.product_id = r.product_id AND dr2.created_at = r.MaxTime',
      )
      .leftJoin('dr2.product', 'p')
      .where('dr2.store_id = :storeId', { storeId: store_id })

    if (data.length > 0) {
      qb.andWhere('dr2.status IN (:...status)', { status: data })
    }

    qb.orderBy('dr2.created_at', 'DESC')

    return await qb.getRawMany()
  }

  /**
   *
   * @param data Data to add delivery request stock
   * @param parentId Delivery request from which stock is created
   * @returns Newly created delivery request
   */
  async addStock(
    data: AddDeliveryStockReq,
    parentId: string,
  ): Promise<DeliveryRequest> {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )

      const productId = data.product.id

      // validate if can add stock
      const deliveryReq = await this.withTransaction(tx).retrieve({
        store_id: data.store_id,
        product_id: productId,
        status: DeliveryRequestStatus.DELIVERED,
      })

      // copy value from old delivery request
      const toCreate: Partial<Omit<DeliveryRequest, 'product'>> = {
        ..._.pick(deliveryReq, [
          'background_type',
          'metadata',
          'shooting',
          'suggested_price',
          'store_id',
        ]),
        product_id: productId,
        status: data.status,
        redelivery_flag: true,
      }

      // create new delivery request
      const newDeliveryReq = await this.withTransaction(tx).create(
        toCreate,
        data.store_id,
        parentId,
      )

      const variants = data.product.variants
      if (!variants?.length) return newDeliveryReq

      await Promise.all(
        variants.map(async (v) => {
          let variantId: string
          if (v.id) {
            // update stock
            variantId = v.id
            // omit inventory quantity => prevent overide inventory quantity
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              inventory_quantity,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              different_quantity,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              different_quantity_flag,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              id,
              ...rest
            } = v

            // update variant
            await this.productVariantService_
              .withTransaction(tx)
              .update(v.id, rest as ExtendedAdminPostProductVariantsReq)
          } else {
            // create new variant
            const variant = {
              ...v,
              options: [],
              prices: [
                {
                  currency_code: JAPANESE_CURRENCY_CODE,
                  amount: deliveryReq.suggested_price || 0,
                },
              ],
              variant_rank: 0,
              inventory_quantity: 0,
            }

            const newVariant = await this.productVariantService_
              .withTransaction(tx)
              .create(productId, variant as ExtendedAdminPostProductVariantsReq)
            variantId = newVariant.id
          }

          await deliveryRequestVariantRepo.save(
            deliveryRequestVariantRepo.create({
              delivery_request_id: newDeliveryReq.id,
              variant_id: variantId,
              delivery_quantity: v.inventory_quantity,
              different_quantity: v.different_quantity,
              different_quantity_flag: v.different_quantity_flag,
            }),
          )
        }),
      )

      // update total_stock of this newly created delivery request
      newDeliveryReq.total_stock = variants.reduce(
        (acc, v) => acc + v.inventory_quantity,
        0,
      )
      await deliveryRequestRepo.save(newDeliveryReq)

      await this.eventBus_
        .withTransaction(tx)
        .emit(DeliveryRequestService.Events.CREATE, {
          id: newDeliveryReq.id,
        })

      return newDeliveryReq
    })
  }

  /**
   * Cancel a delivery request from pending status
   * @param id Id of delivery request needs to be cancelled
   * @returns void
   */
  async cancel(id: string) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )

      const deliveryReq = await this.withTransaction(tx).retrieve(
        {
          id,
          parent_id: Not(IsNull()),
        },
        { select: ['id', 'status', 'parent_id'] },
      )

      // only pending delivery status can be canceled
      if (deliveryReq.status !== DeliveryRequestStatus.PENDING) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `${deliveryReq.status} delivery request can not be canceled!`,
        )
      }

      deliveryReq.status = DeliveryRequestStatus.CANCELLED
      deliveryReq.admin_status = DeliveryRequestAdminStatus.CANCELLED
      deliveryReq.canceled_at = new Date()

      await deliveryRequestRepo.save(deliveryReq)

      await this.eventBus_.emit(DeliveryRequestService.Events.UPDATE, {
        id: deliveryReq.parent_id,
      })
    })
  }

  async delete(id: string, is_parent = true) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )

      if (is_parent === true) {
        const deliveryReq = await this.withTransaction(tx).retrieve(
          {
            id,
            parent_id: IsNull(),
          },
          {
            relations: ['children'],
            select: ['id', 'status'],
          },
        )

        if (deliveryReq.children) {
          await Promise.all(
            deliveryReq.children.map(async (e) => {
              await deliveryRequestRepo.update(
                { id: e.id },
                {
                  status: DeliveryRequestStatus.DELETED,
                  deleted_at: new Date(),
                },
              )
            }),
          )
        }

        deliveryReq.status = DeliveryRequestStatus.DELETED
        deliveryReq.deleted_at = new Date()

        await deliveryRequestRepo.save(deliveryReq)
      } else {
        const deliveryReq = await this.withTransaction(tx).retrieve(
          {
            id,
            parent_id: Not(IsNull()),
          },
          {
            select: ['id', 'status'],
          },
        )

        deliveryReq.status = DeliveryRequestStatus.DELETED
        deliveryReq.deleted_at = new Date()

        await deliveryRequestRepo.save(deliveryReq)
      }
    })
  }

  async convertDeliveryRequest(
    data: DeliveryRequest,
  ): Promise<DeliveryReqDetailRes> {
    let result = {} as DeliveryReqDetailRes

    result = Object.assign(
      result,
      _.pick(data, [
        'id',
        'status',
        'display_id',
        'created_at',
        'released_at',
        'admin_status',
        'metadata',
      ]),
    )

    result.store = _.pick(data.store, [
      'id',
      'name',
      'display_id',
      'store_detail',
      'customer',
    ])
    result.store.store_detail = _.pick(data.store.store_detail, [
      'id',
      'company_name',
    ])

    result.store.customer = _.pick(data.store.customer, [
      'id',
      'nickname',
      'display_id',
    ])

    const children: DeliveryReqChildrenRes[] = data.children.map((e) => ({
      ..._.pick(e, [
        'id',
        'created_at',
        'display_id',
        'suggested_price',
        'total_stock',
        'background_type',
        'redelivery_flag',
        'shooting',
        'status',
        'admin_status',
      ]),
      product: {
        ..._.pick(e.product, [
          'id',
          'title',
          'type_id',
          'type_lv1_id',
          'type_lv2_id',
          'display_code',
          'display_id',
          'variants',
          'tags',
          'status',
          'product_colors',
          'product_specs',
          'product_material',
          'description',
          'material_id',
        ]),
        variants: e.product.variants.map((val) => ({
          ..._.pick(val, [
            'id',
            'title',
            'requests',
            'options',
            'threshold_quantity',
            'restocking_responsive',
          ]),
        })),
      },
    }))

    result.children = children

    return result
  }

  async addInventory(id: string) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )

      const productVariantRepo = tx.getCustomRepository(
        this.productVariantRepo_,
      )

      const raw = await deliveryRequestVariantRepo.find({
        delivery_request_id: id,
      })

      await Promise.all(
        raw.map(async (dev) => {
          const data = await productVariantRepo.findOne({ id: dev.variant_id })

          let quantity = 0

          if (dev.different_quantity_flag === true) {
            quantity = dev.different_quantity
          } else {
            quantity = dev.delivery_quantity
          }

          data.inventory_quantity = data.inventory_quantity + quantity

          await productVariantRepo.save(data)
        }),
      )
    })
  }

  async decorateDelivery(
    data: DeliveryRequest,
    status?: string[],
    title?: string,
  ) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestVariantRepo = tx.getCustomRepository(
        this.deliveryRequestVariantRepo_,
      )

      if (status?.length > 0) {
        data.children = data.children.filter((i) => status.includes(i.status))
      } else {
        data.children = data.children.filter(
          (i) => i.status !== DeliveryRequestStatus.DELETED,
        )
      }

      if (title) {
        data.children = data.children.filter(
          (i) =>
            i.product.title
              .toLocaleLowerCase()
              .indexOf(title.toLocaleLowerCase()) > -1,
        )
      }

      await Promise.all(
        data.children.map(async (e) => {
          const variants = (
            await deliveryRequestVariantRepo.find({
              where: { delivery_request_id: e.id },
              select: ['variant_id'],
            })
          ).map((d) => d.variant_id)

          return (e.product.variants = e.product.variants.filter((d) =>
            variants.includes(d.id),
          ))
        }),
      )

      return data
    })
  }

  async stopDeliveryRequest(id: string) {
    return this.atomicPhase_(async (tx) => {
      const deliveryRequestRepo = tx.getCustomRepository(
        this.deliveryRequestRepo_,
      )

      const deliveryRequest = await deliveryRequestRepo.findOne({
        id,
        parent_id: Not(IsNull()),
      })

      if (!deliveryRequest) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Delivery request with id:${id} not found!`,
        )
      }
      deliveryRequest.admin_status = DeliveryRequestAdminStatus.STOP_PRODUCT
      await deliveryRequestRepo.save(deliveryRequest)

      await this.eventBus_.emit(DeliveryRequestService.Events.UPDATE, {
        id: deliveryRequest.parent_id,
      })
    })
  }

  async genEmailData(
    event: string,
    data: DeliveryNotificationData,
  ): Promise<EmailTemplateData> {
    try {
      const deliveryRequestRepo = this.manager_.getCustomRepository(
        this.deliveryRequestRepo_,
      )
      if (data.is_parent) {
        const delivery = await deliveryRequestRepo.findOne(
          {
            id: data.id,
          },
          {
            relations: [
              'store',
              'store.owner',
              'store.store_detail',
              'children',
              'children.product',
              'children.product.variants',
              'children.product.variants.requests',
              'children.product.variants.options',
            ],
          },
        )

        return {
          to: delivery.store.owner.email,
          format: data.format,
          data: delivery,
          customer_id: delivery.store.owner.id,
        }
      } else {
        const delivery = await deliveryRequestRepo.findOne(
          {
            id: data.id,
          },
          {
            relations: [
              'store',
              'store.owner',
              'store.store_detail',
              'product',
              'product.variants',
              'product.variants.requests',
              'product.variants.options',
            ],
          },
        )
        return {
          to: delivery.store.owner.email,
          format: data.format,
          data: delivery,
          customer_id: delivery.store.owner.id,
        }
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }

  async saveNote(id: string, note: string) {
    const deliveryRequestRepo = this.manager_.getCustomRepository(
      this.deliveryRequestRepo_,
    )

    await deliveryRequestRepo.update(id, { metadata: { note } })
  }
}

interface DeliveryNotificationData {
  id: string
  format: string
  data?: object
  is_parent: boolean
}
