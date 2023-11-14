import { ProductStatus, TransactionBaseService } from '@medusajs/medusa'
import { ProductOptionValueRepository } from '@medusajs/medusa/dist/repositories/product-option-value'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { isDefined } from 'class-validator'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import UserService from '../../../modules/user/services/user.service'
import { StoreStatus } from '../../store/entity/store.entity'
import { RestockRequestBody } from '../controllers/restock-request.admin.controller'
import { RestockRequest } from '../entity/restock-request.entity'
import ProductRepository from '../repository/product.repository'
import { RestockRequestRepository } from '../repository/restock-request.repository'
import {
  getProductVariantSku,
  ProductVariantService,
} from './product-variant.service'

type InjectedDependencies = {
  manager: EntityManager
  eventBusService: EventBusService
  userService: UserService
  restockRequestRepository: typeof RestockRequestRepository
  productRepository: typeof ProductRepository
  productVariantService: ProductVariantService
  productOptionValueRepository: typeof ProductOptionValueRepository
  logger: Logger
}

@Service()
export class RestockRequestService
  extends TransactionBaseService
  implements IEmailTemplateDataService
{
  static Events = {
    RESTOCK_REQUEST_SHOP: 'product.restock_request_shop',
    RESTOCK_REQUEST_USER: 'product.restock_request_user',
    RESTOCK_VARIANT_ANNOUNCE: 'product.restock_variant_announce',
  }
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  static resolutionKey = 'restockRequestService'
  private readonly eventBus_: EventBusService
  protected userService: UserService
  protected logger_: Logger
  protected readonly restockRequestRepository_: typeof RestockRequestRepository
  protected productRepository_: typeof ProductRepository
  protected productVariantService: ProductVariantService
  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.logger_ = container.logger
    this.eventBus_ = container.eventBusService
    this.productRepository_ = container.productRepository
    this.productVariantService = container.productVariantService
    this.restockRequestRepository_ = container.restockRequestRepository
    this.userService = container.userService
  }

  public async checkConditionRestockRequest(
    data: {
      product_id: string
      variant_id: string
    },
    throwIfError = true,
  ) {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_,
    )

    const variant = await this.productVariantService.retrieve(data.variant_id, {
      relations: ['options'],
    })

    if (!isDefined(variant)) {
      if (throwIfError) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Variant with id ${data.variant_id} was not found`,
        )
      } else {
        return { isValid: false }
      }
    }

    if (data.product_id !== variant.product_id) {
      if (throwIfError) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Variant with id ${data.variant_id} has product id different ${data.product_id}`,
        )
      } else {
        return { isValid: false }
      }
    }

    const product = await productRepo.findOne(
      { id: data.product_id },
      {
        relations: ['store', 'store.owner'],
      },
    )

    if (!isDefined(product)) {
      if (throwIfError) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product with id ${data.product_id} was not found`,
        )
      } else {
        return { isValid: false }
      }
    }

    if (
      product.status !== ProductStatus.PUBLISHED ||
      product.store?.status !== StoreStatus.APPROVED
    ) {
      if (throwIfError) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product can not be restocked`,
        )
      } else {
        return { isValid: false }
      }
    }

    return {
      product,
      variant,
      isValid: true,
    }
  }
  public async handleRestockRequestComplete(data: {
    product_id: string
    variant_id: string
  }) {
    return this.atomicPhase_(async (transactionManager) => {
      const { product, variant, isValid } =
        await this.checkConditionRestockRequest(data, false)

      if (!isValid) return

      const restockRequestRepo = transactionManager.getCustomRepository(
        this.restockRequestRepository_,
      )

      // check if variant is out of stock => do nothing, just return
      if (variant.manage_inventory && variant.inventory_quantity === 0) return

      const restockRqs = await restockRequestRepo.find({
        where: {
          variant_id: data.variant_id,
          product_id: data.product_id,
        },
        relations: ['user'],
      })
      const restockRequestUsers = restockRqs.map(
        (rq: RestockRequest) => rq.user,
      )

      const userIds = restockRequestUsers.reduce((accumulator, current) => {
        const exists = accumulator.find((item) => {
          return item.id === current.id
        })
        if (!exists) {
          accumulator = accumulator.concat(current)
        }
        return accumulator
      }, [])

      if (!userIds?.length) return

      await Promise.all(
        userIds.map(
          async (user) =>
            await this.eventBus_
              .withTransaction(this.transactionManager_)
              .emit(RestockRequestService.Events.RESTOCK_VARIANT_ANNOUNCE, {
                id: user.email,
                email: user.email,
                customer_id: user.id,
                format: 'product-restock-variant-announce',
                data: {
                  nickname: user.nickname,
                  product: product,
                  sku: getProductVariantSku(variant.options),
                },
              }),
        ),
      )
        .then(async () => {
          await restockRequestRepo.delete({
            variant_id: data.variant_id,
            product_id: data.product_id,
          })
        })
        .catch((err) => {
          this.logger_.error(err)
        })
    })
  }

  public async createRestockRequest(data: RestockRequestBody, userId: string) {
    return this.atomicPhase_(async (transactionManager) => {
      const restockRequestRepo = transactionManager.getCustomRepository(
        this.restockRequestRepository_,
      )

      const { product, variant } = await this.checkConditionRestockRequest(data)

      if (
        (variant.manage_inventory && variant.inventory_quantity > 0) ||
        !variant.manage_inventory
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Variant with id ${data.variant_id} was not soldout`,
        )
      }

      if (product.store?.owner?.id === userId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Can not restock your own product`,
        )
      }

      const restock = await restockRequestRepo.save(
        restockRequestRepo.create({
          ...data,
          user_id: userId,
        }),
      )

      const user = await this.userService.retrieve(userId)

      await this.eventBus_
        .withTransaction(this.transactionManager_)
        .emit(RestockRequestService.Events.RESTOCK_REQUEST_SHOP, {
          id: product.store.owner.email,
          email: product.store.owner.email,
          customer_id: product.store.owner?.id,
          format: 'product-restock-request-shop',
          data: {
            nickname: user.nickname,
            product: product,
            sku: getProductVariantSku(variant.options),
            reason: data.content,
          },
        })

      await this.eventBus_
        .withTransaction(this.transactionManager_)
        .emit(RestockRequestService.Events.RESTOCK_REQUEST_USER, {
          id: user.email,
          customer_id: user.id,
          email: user.email,
          format: 'product-restock-request-user',
          data: {
            nickname: user.nickname,
            product: product,
            sku: getProductVariantSku(variant.options),
          },
        })
      return restock
    })
  }

  async genEmailData(
    event: string,
    data: RestockRequestData,
  ): Promise<EmailTemplateData> {
    return {
      to: data.email,
      format: data.format,
      data: data.data,
      customer_id: data.customer_id ?? null,
    }
  }
}

interface RestockRequestData {
  id: string
  format: string
  email: string
  data: object
  customer_id?: string
}
