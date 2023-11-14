/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DiscountRuleType } from '@medusajs/medusa'
import {
  BatchJobService,
  EventBusService,
} from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Subscriber } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import {
  EAST_ASIA_REGION_ID,
  THRESH_HOLD_PROMO_CODE,
} from '../../../helpers/constant'
import StoreService from '../../../modules/store/services/store.service'
import { DiscountStatus, DiscountType } from '../entities/discount.entity'
import { PromotionCodeMasterService } from '../services/promotion-code-master.service'
import { DiscountService } from './../../discount/services/discount.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  manager: EntityManager
  discountService: DiscountService
  storeService: StoreService
  logger: Logger
  promotionCodeMasterService: PromotionCodeMasterService
  batchJobService: BatchJobService
}

@Subscriber()
export class DiscountSubscriber {
  private readonly manager_: EntityManager
  private readonly eventBus_: EventBusService
  protected discountService_: DiscountService
  protected storeService_: StoreService
  protected logger_: Logger
  protected promotionCodeMasterService_: PromotionCodeMasterService
  protected batchJobService_: BatchJobService

  constructor({
    eventBusService,
    manager,
    discountService,
    storeService,
    logger,
    promotionCodeMasterService,
    batchJobService,
  }: InjectedDependencies) {
    this.eventBus_ = eventBusService
    this.manager_ = manager
    this.discountService_ = discountService
    this.storeService_ = storeService
    this.logger_ = logger
    this.promotionCodeMasterService_ = promotionCodeMasterService
    this.batchJobService_ = batchJobService

    this.eventBus_.subscribe(
      StoreService.Events.CREATED,
      this.handleStoreCreated.bind(this),
    )
  }

  /**
   * Allocate a random promotion code for newly created store
   * @param param0
   * @returns
   */
  async handleStoreCreated({ id }: { id: string }) {
    try {
      this.manager_.transaction(async (tx) => {
        const randomCode = await this.promotionCodeMasterService_
          .withTransaction(tx)
          .getRandomAvailableCode()

        if (!randomCode) return

        // create new discount
        await this.discountService_.withTransaction(tx).create({
          code: randomCode.code,
          starts_at: new Date(),
          is_disabled: false,
          is_dynamic: false,
          rule: {
            value: 5,
            allocation: null,
            type: DiscountRuleType.PERCENTAGE,
          },
          regions: [EAST_ASIA_REGION_ID],
          type: DiscountType.PROMO_CODE,
          status: DiscountStatus.PUBLISHED,
          owner_store_id: id,
        })

        // update code
        await this.promotionCodeMasterService_
          .withTransaction(tx)
          .update(randomCode.id, { store_id: id, is_available: false })

        const totalAvailable = await this.promotionCodeMasterService_
          .withTransaction(tx)
          .getTotalPromotionCodeMaster({
            where: { is_available: true },
          })

        // if available promotion codes left is below threshold => re-generate promotion codes
        if (totalAvailable < THRESH_HOLD_PROMO_CODE) {
          this.logger_.warn(
            `Numbers of available promotion codes left is below ${THRESH_HOLD_PROMO_CODE} => Re-generate`,
          )

          await this.promotionCodeMasterService_
            .withTransaction(tx)
            .reGenerateCodeMaster()
        }
      })
    } catch (error) {
      this.logger_.error(error)
    }
  }
}
