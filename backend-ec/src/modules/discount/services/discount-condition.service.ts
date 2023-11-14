import { DiscountConditionService as MedusaDiscountConditionService } from '@medusajs/medusa'
import {
  DiscountCondition,
  DiscountConditionCustomerGroup,
  DiscountConditionOperator,
  DiscountConditionProduct,
  DiscountConditionProductCollection,
  DiscountConditionProductTag,
  DiscountConditionProductType,
} from '@medusajs/medusa/dist/models'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery, PostgresError } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { EventBusService } from '../../event/event-bus.service'
import { DiscountConditionStoreGroup } from '../entities/discount-condition-store-group.entity'
import {
  DiscountConditionRepository,
  DiscountConditionTypeEnum,
} from '../repository/discount-condition.repository'

export type UpsertDiscountConditionInput = {
  rule_id?: string
  id?: string
  operator?: DiscountConditionOperator
  products?: string[]
  product_collections?: string[]
  product_types?: string[]
  product_tags?: string[]
  customer_groups?: string[]
  store_groups?: string[]
}

type InjectedDependencies = {
  manager: EntityManager
  discountConditionRepository: typeof DiscountConditionRepository
  eventBusService: EventBusService
}

@Service({ override: MedusaDiscountConditionService })
export class DiscountConditionService extends MedusaDiscountConditionService {
  static resolutionKey = 'discountConditionService'

  protected readonly discountConditionRepository_: typeof DiscountConditionRepository
  protected readonly eventBus_: EventBusService
  protected manager_: EntityManager
  protected transactionManager_: EntityManager | undefined

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.discountConditionRepository_ = container.discountConditionRepository
    this.eventBus_ = container.eventBusService
  }

  async retrieve(
    conditionId: string,
    config?: FindConfig<DiscountCondition>,
  ): Promise<DiscountCondition | never> {
    const manager = this.manager_
    const conditionRepo = manager.getCustomRepository(
      this.discountConditionRepository_,
    )

    const query = buildQuery({ id: conditionId }, config)

    const condition = await conditionRepo.findOne(query)

    if (!condition) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `DiscountCondition with id ${conditionId} was not found`,
      )
    }

    return condition
  }

  async resolveConditionTypes_(
    data: UpsertDiscountConditionInput,
  ): Promise<{ type: any; resource_ids: string[] }> {
    switch (true) {
      case !!data.products?.length:
        return {
          type: DiscountConditionTypeEnum.PRODUCTS,
          resource_ids: data.products,
        }
      case !!data.product_collections?.length:
        return {
          type: DiscountConditionTypeEnum.PRODUCT_COLLECTIONS,
          resource_ids: data.product_collections,
        }
      case !!data.product_types?.length:
        return {
          type: DiscountConditionTypeEnum.PRODUCT_TYPES,
          resource_ids: data.product_types,
        }
      case !!data.product_tags?.length:
        return {
          type: DiscountConditionTypeEnum.PRODUCT_TAGS,
          resource_ids: data.product_tags,
        }
      case !!data.customer_groups?.length:
        return {
          type: DiscountConditionTypeEnum.CUSTOMER_GROUPS,
          resource_ids: data.customer_groups,
        }
      case !!data.store_groups?.length:
        return {
          type: DiscountConditionTypeEnum.STORE_GROUPS,
          resource_ids: data.store_groups,
        }
      default:
        return undefined
    }
  }

  async upsertConditions(
    data: UpsertDiscountConditionInput,
  ): Promise<
    (
      | DiscountConditionProduct
      | DiscountConditionProductType
      | DiscountConditionProductCollection
      | DiscountConditionProductTag
      | DiscountConditionCustomerGroup
      | DiscountConditionStoreGroup
    )[]
  > {
    let resolvedConditionType

    return await this.atomicPhase_(
      async (manager: EntityManager) => {
        resolvedConditionType = await this.resolveConditionTypes_(data)
        if (!resolvedConditionType) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Missing one of products, collections, tags, types or customer groups or store groups in data`,
          )
        }

        const discountConditionRepo: DiscountConditionRepository =
          manager.getCustomRepository(this.discountConditionRepository_)

        if (data.id) {
          const resolvedCondition = await this.retrieve(data.id)
          if (data.operator && data.operator !== resolvedCondition.operator) {
            resolvedCondition.operator = data.operator
            await discountConditionRepo.save(resolvedCondition)
          }

          return await discountConditionRepo.addConditionResourcess(
            data.id,
            resolvedConditionType.resource_ids,
            resolvedConditionType.type,
            true,
          )
        }

        const created = discountConditionRepo.create({
          discount_rule_id: data.rule_id,
          operator: data.operator,
          type: resolvedConditionType.type,
        })

        const discountCondition = await discountConditionRepo.save(created)

        return await discountConditionRepo.addConditionResourcess(
          discountCondition.id,
          resolvedConditionType.resource_ids,
          resolvedConditionType.type,
        )
      },

      async (err: { code: string }) => {
        if (err.code === PostgresError.DUPLICATE_ERROR) {
          throw new MedusaError(
            MedusaError.Types.DUPLICATE_ERROR,
            `Discount Condition with operator '${data.operator}' and type '${resolvedConditionType?.type}' already exist on a Discount Rule`,
          )
        }
      },
    )
  }

  async delete(discountConditionId: string): Promise<DiscountCondition | void> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const conditionRepo = manager.getCustomRepository(
        this.discountConditionRepository_,
      )

      const condition = await conditionRepo.findOne({
        where: { id: discountConditionId },
      })

      if (!condition) {
        return Promise.resolve()
      }

      return await conditionRepo.remove(condition)
    })
  }
}
