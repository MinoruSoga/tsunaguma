import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { FulfillmentPrice } from '../entities/fulfillment-price.entity'
import { FulfillmentPriceRepository } from '../repositories/fulfillment-price.repository'

type InjectedDependencies = {
  manager: EntityManager
  fulfillmentPriceRepository: typeof FulfillmentPriceRepository
}
@Service()
export class FulfillmentPriceService extends TransactionBaseService {
  static resolutionKey = 'fulfillmentPriceService'

  protected readonly manager_: EntityManager
  protected transactionManager_: EntityManager
  protected readonly fulfillmentPriceRepository_: typeof FulfillmentPriceRepository
  constructor(private readonly container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.fulfillmentPriceRepository_ = container.fulfillmentPriceRepository
  }

  async getFulfillmentPrice(
    selector: Selector<FulfillmentPrice>,
    config: FindConfig<FulfillmentPrice>,
  ) {
    const fulfillmentPriceRepo = this.manager_.getCustomRepository(
      this.fulfillmentPriceRepository_,
    )
    delete config?.take
    let query = buildQuery(
      {
        ...selector,
        size: selector?.size || null,
      },
      config,
    )
    const [result, total] = await fulfillmentPriceRepo.findAndCount(query)

    if (result.length) {
      return [result, total]
    } else {
      delete selector?.from_pref_id
      query = buildQuery(
        {
          ...selector,
          size: selector?.size || null,
        },
        config,
      )
      const [result, total] = await fulfillmentPriceRepo.findAndCount(query)
      if (total === 1) return [result, total]
      return [[], 0]
    }
  }
}
