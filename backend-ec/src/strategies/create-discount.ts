import { AbstractBatchJobStrategy, BatchJobService } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import dayjs from 'dayjs'
import { EntityManager } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { defaultAdminDiscountsRelations } from '../modules/discount/discount.router'
import {
  Discount,
  DiscountStatus,
  DiscountType,
} from '../modules/discount/entities/discount.entity'
import {
  CreateDiscountInput,
  DiscountService,
} from '../modules/discount/services/discount.service'
import { PromotionCodeMasterService } from '../modules/discount/services/promotion-code-master.service'
import { StoreGroupService } from '../modules/discount/services/store-group.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  logger: Logger
  discountService: DiscountService
  promotionCodeMasterService: PromotionCodeMasterService
  storeGroupService: StoreGroupService
}

class CustomerExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'create-discount-strategy'
  static batchType = 'create-discount'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected logger_: Logger
  protected discountService_: DiscountService
  protected storeGroupService_: StoreGroupService
  protected promotionCodeMasterService_: PromotionCodeMasterService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.logger_ = container.logger
    this.discountService_ = container.discountService
    this.storeGroupService_ = container.storeGroupService
    this.promotionCodeMasterService_ = container.promotionCodeMasterService
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    const batchJob = await this.batchJobService_.retrieve(batchJobId)

    const storeTargetGroup = batchJob.context?.storeTargetGroup as string

    const stores = await this.storeGroupService_.getStores(storeTargetGroup)

    const discountId = batchJob.context?.discountId as string

    let discount: Discount = undefined

    if (discountId) {
      discount = (await this.discountService_.retrieve(discountId, {
        relations: defaultAdminDiscountsRelations.concat([
          'rule.conditions.customer_groups',
          'rule.conditions.store_groups',
          'rule.conditions.products',
        ]),
      })) as Discount
    }

    let storeIds = []
    if (discount) {
      stores.map((e) => {
        if (e !== discount.owner_store_id) {
          storeIds.push(e)
        }
      })
    } else {
      storeIds = stores.map((e) => {
        return e
      })
    }

    batchJob.context.storeIds = storeIds
    await this.batchJobService_.update(batchJob, {
      result: {
        advancement_count: 0,
        count: storeIds.length,
        stat_descriptors: [
          {
            key: 'create-discount-count',
            name: 'Number of discounts to create',
            message: `${storeIds.length} discount(s) will be create.`,
          },
        ],
      },
    })
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const storeIds = (batchJob.context.storeIds || []) as string[]

      const body: CreateDiscountInput = batchJob.context
        .body as CreateDiscountInput

      let count = 0

      const discountId = batchJob.context?.discountId as string

      let discount: Discount = undefined

      if (discountId) {
        discount = (await this.discountService_.retrieve(discountId, {
          relations: defaultAdminDiscountsRelations.concat([
            'rule.conditions.customer_groups',
            'rule.conditions.store_groups',
            'rule.conditions.products',
          ]),
        })) as Discount
      }

      try {
        for (const e of storeIds) {
          let code: string

          if (body.type === DiscountType.PROMO_CODE) {
            const promose_code_master =
              await this.promotionCodeMasterService_.getRandomAvailableCode()
            code = promose_code_master.code

            await this.promotionCodeMasterService_.update(
              promose_code_master.id,
              {
                is_available: false,
              },
            )
          } else {
            code = uuid()
          }

          if (!body.status) {
            body.status = DiscountStatus.PUBLISHED
          }

          await this.manager_.transaction(async (transactionManager) => {
            const store_group = await this.storeGroupService_
              .withTransaction(transactionManager)
              .create({
                name: `Group-store-target-${dayjs().format(
                  '[YYYYescape] YYYY-MM-DDTHH:mm:ssZ[Z]',
                )}`,
              })

            await this.storeGroupService_
              .withTransaction(transactionManager)
              .addStores(store_group.id, e)

            await this.discountService_
              .withTransaction(transactionManager)
              .create({
                ...body,
                code,
                owner_store_id: e,
                store_target_group: store_group.id,
              })

            count++
          })
        }

        if (discount) {
          await this.storeGroupService_.removeGroupStores(
            discount.store_target_group,
            discount.owner_store_id,
          )
        }

        await this.batchJobService_
          .withTransaction(transactionManager)
          .update(batchJobId, {
            result: {
              advancement_count: storeIds.length,
              progress: storeIds.length / (count || 1),
            },
          })
      } catch (error) {
        this.logger_.error(error)
      }
    })
  }

  async buildTemplate(): Promise<string> {
    return ''
  }
  // handle error
  protected async handleProcessingError<T>(
    batchJobId: string,
    err: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    result: T,
  ): Promise<void> {
    // different implementation...
    this.logger_.error('Batch job with id ' + batchJobId + ' failed ==> ' + err)
  }
}

export default CustomerExportStrategy
