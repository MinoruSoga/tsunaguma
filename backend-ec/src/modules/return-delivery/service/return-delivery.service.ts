import { ProductStatus, TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager, In, Not } from 'typeorm'

import { EmailTemplateData } from '../../../interfaces/email-template'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { EventBusService } from '../../event/event-bus.service'
import { ProductStatusEnum } from '../../product/entity/product.entity'
import ProductRepository from '../../product/repository/product.repository'
import { ProductVariantRepository } from '../../product/repository/product-variant.repository'
import { ProductService } from '../../product/services/product.service'
import {
  ReturnDelivery,
  ReturnDeliveryOriginEnum,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'
import { ReturnDeliveryRepository } from '../repository/return-delivery.repository'

type InjectedDependencies = {
  manager: EntityManager
  returnDeliveryRepository: typeof ReturnDeliveryRepository
  productVariantRepository: typeof ProductVariantRepository
  productRepository: typeof ProductRepository
  productService: ProductService
  eventBusService: EventBusService
  logger: Logger
}

export type CreateReturnDeliveryReq = {
  store_id: string
  variant_id: string
  quantity: number
  reason?: string
  note?: string
  origin?: ReturnDeliveryOriginEnum
  status?: ReturnDeliveryStatus
  delivery_slip_no?: string
  is_pause?: boolean
  metadata?: object
}

export type UpdateReturnDeliveryReq = {
  store_id?: string
  variant_id?: string
  quantity?: number
  reason?: string
  note?: string
  origin?: ReturnDeliveryOriginEnum
  status?: ReturnDeliveryStatus
  delivery_slip_no?: string
  is_pause?: boolean
  metadata?: object
}

@Service()
export class ReturnDeliveryService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'returnDeliveryService'

  protected readonly returnDeliveryRepo_: typeof ReturnDeliveryRepository
  protected readonly productVariantRepo_: typeof ProductVariantRepository
  protected readonly productService: ProductService
  protected readonly productRepo_: typeof ProductRepository
  protected readonly eventBusService_: EventBusService
  private logger_: Logger

  static Events = {
    REQUESTED: 'return_delivery.requested',
    SHIPPED: 'return_delivery.shipped',
  }

  constructor(container: InjectedDependencies) {
    super(container)
    this.returnDeliveryRepo_ = container.returnDeliveryRepository
    this.productVariantRepo_ = container.productVariantRepository
    this.productRepo_ = container.productRepository
    this.productService = container.productService
    this.manager_ = container.manager
    this.eventBusService_ = container.eventBusService
    this.logger_ = container.logger
  }

  async create_(data: CreateReturnDeliveryReq, user: LoggedInUser) {
    return await this.atomicPhase_(async (manager) => {
      const returnDeliveryRepo = manager.getCustomRepository(
        this.returnDeliveryRepo_,
      )
      const productVariantRepo = manager.getCustomRepository(
        this.productVariantRepo_,
      )

      const variant = await productVariantRepo.findOne({
        id: data.variant_id,
        is_deleted: false,
        product: {
          store_id: data.store_id,
        },
      })

      if (!variant) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Variant not found!`)
      }

      if (data.quantity > variant.inventory_quantity) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Quantity exceeds the number of variants`,
        )
      }

      const product = await this.productService.retrieve(variant.product_id)
      if (!product) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product with variants not found!`,
        )
      }

      //update product return delivery to private
      if (product.status !== ProductStatus.REJECTED) {
        await this.productService.updateStatusCms(
          [variant.product_id],
          'private',
          user,
        )
      }

      const toCreate = returnDeliveryRepo.create({
        ...data,
        status: ReturnDeliveryStatus.REQUESTED,
        origin: ReturnDeliveryOriginEnum.REQUESTED,
      })

      return await returnDeliveryRepo.save(toCreate)
    })
  }

  async list_(
    storeId: string,
    selector: Selector<ReturnDelivery>,
    config: FindConfig<ReturnDelivery>,
  ): Promise<[ReturnDelivery[], number]> {
    const returnDeliveryRepo = this.manager_.getCustomRepository(
      this.returnDeliveryRepo_,
    )

    const query = buildQuery(selector, config)

    query.where.store_id = storeId

    return await returnDeliveryRepo.findAndCount(query)
  }

  async delete_(id: string) {
    return await this.atomicPhase_(async (manager) => {
      const returnDeliveryRepo = manager.getCustomRepository(
        this.returnDeliveryRepo_,
      )

      const returnDelivery = await returnDeliveryRepo.findOne(id)

      if (!returnDelivery) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Return Delivery not found!`,
        )
      }

      await returnDeliveryRepo.delete(id)
    })
  }

  async pause(id: string) {
    return await this.atomicPhase_(async (manager) => {
      const returnDeliveryRepo = manager.getCustomRepository(
        this.returnDeliveryRepo_,
      )

      const returnDelivery = await returnDeliveryRepo.findOne(id)

      if (!returnDelivery) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Return Delivery not found!`,
        )
      }

      returnDelivery.is_pause = !returnDelivery.is_pause

      return await returnDeliveryRepo.save(returnDelivery)
    })
  }

  async retrieve_(id: string) {
    return await this.atomicPhase_(async (manager) => {
      const returnDeliveryRepo = manager.getCustomRepository(
        this.returnDeliveryRepo_,
      )

      const query = buildQuery(
        { id },
        {
          relations: ['store', 'store.customer', 'variant'],
        },
      )

      const return_delivery = await returnDeliveryRepo.findOne(query)
      if (!return_delivery) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Return Delivery not found!`,
        )
      }

      return return_delivery
    })
  }

  async update_(id: string, data: UpdateReturnDeliveryReq, user: LoggedInUser) {
    return await this.atomicPhase_(async (manager) => {
      const returnDeliveryRepo = manager.getCustomRepository(
        this.returnDeliveryRepo_,
      )

      const productVariantRepo = manager.getCustomRepository(
        this.productVariantRepo_,
      )

      let is_send = false

      const returnDelivery = await returnDeliveryRepo.findOne({
        id,
        is_pause: false,
      })

      if (!returnDelivery) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Return Delivery not found!`,
        )
      }

      const toUpdate: DeepPartial<ReturnDelivery> = {
        ...returnDelivery,
        ...data,
      }

      if (
        toUpdate.status === ReturnDeliveryStatus.SHIPPED &&
        !returnDelivery.shipped_at
      ) {
        toUpdate.shipped_at = new Date()
        is_send = true
      }

      const variant = await productVariantRepo.findOne({
        id: toUpdate.variant_id,
        is_deleted: false,
        product: {
          store_id: toUpdate.store_id,
        },
      })

      if (!variant) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Variant not found!`)
      }

      if (toUpdate.quantity > variant.inventory_quantity) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Quantity exceeds the number of variants`,
        )
      }

      const product = await this.productService.retrieve(variant.product_id)
      if (!product) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product with variants not found!`,
        )
      }

      if (product.status !== ProductStatus.REJECTED) {
        await this.productService.updateStatusCms(
          [variant.product_id],
          'private',
          user,
        )
      }

      await returnDeliveryRepo.save(toUpdate)

      if (is_send) {
        await this.eventBusService_.emit(ReturnDeliveryService.Events.SHIPPED, {
          id: [id],
          format: 'return-delivery-shipped-shop',
        })
      }
    })
  }

  async listProduct(storeId: string) {
    const productRepo = this.manager_.getCustomRepository(this.productRepo_)

    const query = buildQuery(
      {
        store_id: storeId,
        status: Not(
          In([
            ProductStatusEnum.deleted,
            ProductStatusEnum.delivery_request,
            ProductStatusEnum.draft,
          ]),
        ),
      },
      { relations: ['variants'] },
    )

    return await productRepo.find(query)
  }

  async genEmailData(
    event: string,
    data: ReturnDeliveryNotificationData,
  ): Promise<EmailTemplateData> {
    try {
      const returnDeliveryRepo = this.manager_.getCustomRepository(
        this.returnDeliveryRepo_,
      )

      const query = buildQuery(
        { id: In(data.id) },
        {
          relations: ['store', 'store.customer', 'variant', 'variant.options'],
        },
      )
      const return_deliveries = await returnDeliveryRepo.find(query)

      return {
        to: return_deliveries[0].store.customer.email,
        format: data.format,
        data: return_deliveries,
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }
}

interface ReturnDeliveryNotificationData {
  id: string[]
  format: string
  data?: object
}
