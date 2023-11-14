/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TransactionBaseService } from '@medusajs/medusa'
import { DiscountConditionRepository } from '@medusajs/medusa/dist/repositories/discount-condition'
import { DiscountRuleRepository } from '@medusajs/medusa/dist/repositories/discount-rule'
import { GiftCardRepository } from '@medusajs/medusa/dist/repositories/gift-card'
import {
  BatchJobService,
  DiscountConditionService,
  EventBusService,
  StrategyResolverService,
} from '@medusajs/medusa/dist/services'
import { request } from 'express'
// import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager, FindManyOptions } from 'typeorm'

import { OrderRepository } from '../../order/repository/order.repository'
import UserService from '../../user/services/user.service'
import { PromotionCodeMaster } from '../entities/promotion-code-master.entity'
import { DiscountRepository } from '../repository/discount.repository'
import { PromotionCodeMasterRepository } from '../repository/promotion-code-master.repository'
import { UserDiscountRepository } from '../repository/user-discount.repository'

type InjectedDependencies = {
  manager: EntityManager
  discountRepository: typeof DiscountRepository
  discountRuleRepository: DiscountRuleRepository
  giftCardRepository: GiftCardRepository
  discountConditionRepository: DiscountConditionRepository
  discountConditionService: DiscountConditionService
  eventBusService: EventBusService
  promotionCodeMasterRepository: typeof PromotionCodeMasterRepository
  batchJobService: BatchJobService
  strategyResolverService: StrategyResolverService
}

type CreatePromoCodeMasterInput = {
  code: string
  store_id?: string
}

type UpdatePromoCodeMasterInput = {
  store_id?: string
  is_available?: boolean
}

@Service()
export class PromotionCodeMasterService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'promotionCodeMasterService'
  protected readonly discountRepository_: typeof DiscountRepository
  protected readonly userDiscountRepository_: typeof UserDiscountRepository
  protected userService: UserService
  protected readonly orderRepo: typeof OrderRepository
  protected promoCodemasterRepo_: typeof PromotionCodeMasterRepository
  protected batchJobService_: BatchJobService
  private readonly strategyResolver_: StrategyResolverService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.discountRepository_ = container.discountRepository
    this.promoCodemasterRepo_ = container.promotionCodeMasterRepository
    this.batchJobService_ = container.batchJobService
    this.strategyResolver_ = container.strategyResolverService
  }

  async getTotalPromotionCodeMaster(
    options: FindManyOptions<PromotionCodeMaster> = {},
  ) {
    const promoCodemasterRepo = this.manager_.getCustomRepository(
      this.promoCodemasterRepo_,
    )

    return await promoCodemasterRepo.count(options)
  }

  async getCurrentPromotionMasterCodes(
    options: FindManyOptions<PromotionCodeMaster> = {},
  ) {
    const promoCodemasterRepo = this.manager_.getCustomRepository(
      this.promoCodemasterRepo_,
    )

    return await promoCodemasterRepo.find(options)
  }

  async createPromotionCodeMaster(
    entities: CreatePromoCodeMasterInput | CreatePromoCodeMasterInput[],
  ) {
    const promoCodemasterRepo = this.manager_.getCustomRepository(
      this.promoCodemasterRepo_,
    )

    if (!Array.isArray(entities)) entities = [entities]
    const toSave = entities.map((e) => promoCodemasterRepo.create(e))

    const result = await promoCodemasterRepo.save(toSave)

    return result
  }

  async isInitPromoCodeMaster(): Promise<boolean> {
    const total = await this.getTotalPromotionCodeMaster()
    return total !== 0
  }

  async getRandomAvailableCode(): Promise<PromotionCodeMaster> {
    const promoCodemasterRepo = this.manager_.getCustomRepository(
      this.promoCodemasterRepo_,
    )
    const record = await promoCodemasterRepo
      .createQueryBuilder('pmc')
      .where({ is_available: true })
      .orderBy('RANDOM()')
      .getOne()

    return record
  }

  async update(id: string, update: UpdatePromoCodeMasterInput) {
    const promoCodemasterRepo = this.manager_.getCustomRepository(
      this.promoCodemasterRepo_,
    )

    await promoCodemasterRepo.update({ id }, update)
  }

  async reGenerateCodeMaster() {
    return this.atomicPhase_(async (tx) => {
      // Preprare before create batch job
      const toCreate = await this.batchJobService_
        .withTransaction(tx)
        .prepareBatchJobForProcessing(
          { dry_run: false, type: 'promo-code-gen', context: {} },
          request,
        )

      // create promotion code gen batch job
      await this.batchJobService_.withTransaction(tx).create({
        ...toCreate,
        created_by: null,
      })
    })
  }

  async listAll_(): Promise<PromotionCodeMaster[]> {
    return this.atomicPhase_(async (tx) => {
      const promoCodemasterRepo = tx.getCustomRepository(
        this.promoCodemasterRepo_,
      )

      return promoCodemasterRepo.find()
    })
  }
}
