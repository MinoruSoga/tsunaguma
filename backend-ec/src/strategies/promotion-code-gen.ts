import {
  AbstractBatchJobStrategy,
  BatchJobService,
  CreateBatchJobInput,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaError } from 'medusa-core-utils'
import { EntityManager, In, IsNull } from 'typeorm'

import {
  MAX_PROMO_CODE_MASTER_TOTAL,
  PROMO_CODE_MASTER_CHARS,
  PROMO_CODE_MASTER_TOTAL,
} from '../helpers/constant'
import { sleep } from '../helpers/time'
import { DiscountType } from '../modules/discount/entities/discount.entity'
import { DiscountService } from '../modules/discount/services/discount.service'
import { PromotionCodeMasterService } from '../modules/discount/services/promotion-code-master.service'
import { PromoCodeGenResponse } from '../types/promotion-code'

type InjectedDependencies = {
  discountService: DiscountService
  manager: EntityManager
  logger: Logger
  batchJobService: BatchJobService
  promotionCodeMasterService: PromotionCodeMasterService
}

class PromotionCodeGenStrategy extends AbstractBatchJobStrategy {
  protected batchJobService_: BatchJobService
  protected transactionManager_: EntityManager
  protected manager_: EntityManager
  private logger_: Logger
  protected discountService_: DiscountService
  protected promotionCodeMasterService_: PromotionCodeMasterService

  static batchType = 'promo-code-gen'
  static identifier = 'promo-code-gen-strategy'
  static MAX_TRY = 50

  constructor(container: InjectedDependencies) {
    super(container)
    this.logger_ = container.logger
    this.batchJobService_ = container.batchJobService
    this.manager_ = container.manager
    this.discountService_ = container.discountService
    this.promotionCodeMasterService_ = container.promotionCodeMasterService
  }

  generateCode() {
    // const timestamp = Date.now()
    // const randomNum = Math.floor(Math.random() * 100000000)
    // const code = `${timestamp}${randomNum}`.substring(0, 8)
    // // return code
    return Math.floor(Math.random() * MAX_PROMO_CODE_MASTER_TOTAL)
      .toString()
      .padStart(PROMO_CODE_MASTER_CHARS, '0')
    // return '1'
  }

  generate(total: number, toExcludes: string[] = []): PromoCodeGenResponse {
    let currentTry = 1
    const genCodes = []
    const map = new Map<string, boolean>()
    for (const code of toExcludes) {
      map.set(code, true)
    }

    while (currentTry <= PromotionCodeGenStrategy.MAX_TRY && total > 0) {
      // logic here
      this.logger_.info(
        'Current try to generate promotion codes: ' + currentTry,
      )

      const currentTryGen = total - genCodes.length

      for (let i = 0; i < currentTryGen; i++) {
        const code = this.generateCode()

        if (!map.has(code) || !map.get(code)) {
          genCodes.push(code)
          map.set(code, true)
        }
      }

      if (genCodes.length === total) break
      currentTry++
    }

    return {
      response_body: genCodes,
      total_try: Math.min(PromotionCodeGenStrategy.MAX_TRY, currentTry),
      response_code: 200,
    }
  }

  async prepareBatchJobForProcessing(
    batchJob: CreateBatchJobInput,
  ): Promise<CreateBatchJobInput> {
    const totalAvailable =
      await this.promotionCodeMasterService_.getTotalPromotionCodeMaster({
        where: { is_available: true },
      })
    const total =
      await this.promotionCodeMasterService_.getTotalPromotionCodeMaster()

    if (total >= MAX_PROMO_CODE_MASTER_TOTAL) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Exceed possible amount of promotion code master!!!',
      )
    }

    batchJob.context = {
      ...(batchJob.context || {}),
      total: PROMO_CODE_MASTER_TOTAL - totalAvailable,
    }

    return batchJob
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      const batchJob = await this.batchJobService_
        .withTransaction(tx)
        .retrieve(batchJobId)

      const currentCodes = (
        await this.discountService_
          .withTransaction(tx)
          .list_(
            { type: DiscountType.PROMO_CODE, parent_discount_id: IsNull() },
            { select: ['code'] },
          )
      ).map((c) => c.code)

      const existCodes = (
        await this.promotionCodeMasterService_.listAll_()
      ).map((pc) => pc.code)

      const minusCodes = Array.from(new Set(currentCodes.concat(existCodes)))
      const totalToGen = batchJob.context.total as number

      const generateCodeData = this.generate(totalToGen, minusCodes)
      const successGeneratedCount = generateCodeData.response_body.length

      this.logger_.info(
        `${successGeneratedCount} promotion codes are generated after ${generateCodeData.total_try} try`,
      )

      await this.batchJobService_.withTransaction(tx).update(batchJob, {
        result: {
          count: successGeneratedCount,
          items: generateCodeData.response_body,
          stat_descriptors: [
            {
              key: 'pre-processs-count',
              name: 'Random promotion codes generated',
              message: `There will be ${successGeneratedCount} promotion codes randomly generated by this action`,
            },
          ],
        },
      })
    })
  }

  processJob(batchJobId: string): Promise<void> {
    return this.manager_.transaction(async (tx) => {
      const batchJob = await this.batchJobService_
        .withTransaction(tx)
        .retrieve(batchJobId)

      const batchJobResult = batchJob.result

      const codes = batchJobResult?.items as string[]
      if (!codes) return

      let successCnt = 0
      let errorCnt = 0
      const errors = []
      const totalToAdd = codes.length

      try {
        // only insert 5000 codes at the same time
        for (let i = 0; i < totalToAdd; i += 5000) {
          await this.promotionCodeMasterService_
            .withTransaction(tx)
            .createPromotionCodeMaster(
              codes.slice(i, i + 5000).map((code) => ({ code })),
            )

          await sleep(1000)
        }
      } catch (error) {
        errors.push(error)
        this.logger_.error(error)
      } finally {
        successCnt = await this.promotionCodeMasterService_
          .withTransaction(tx)
          .getTotalPromotionCodeMaster({ where: { code: In(codes) } })

        errorCnt = totalToAdd - successCnt

        batchJobResult.errors = errors
        batchJobResult.advancement_count = successCnt
        batchJobResult.error_count = errorCnt

        await this.batchJobService_.withTransaction(tx).update(batchJob, {
          result: batchJobResult,
        })
      }
    })
  }

  buildTemplate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}

export default PromotionCodeGenStrategy
