import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ReturnDeliveryHistory } from '../entities/return-delivery-history.entity'
import { ReturnDeliveryHistoryRepository } from '../repository/return-delivery-history.repository'
import { ReturnDeliveryService } from './return-delivery.service'

type InjectedDependencies = {
  manager: EntityManager
  returnDeliveryHistoryRepository: typeof ReturnDeliveryHistoryRepository
  returnDeliveryService: ReturnDeliveryService
}

@Service()
export class ReturnDeliveryHistoryService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'returnDeliveryHistoryService'

  protected readonly returnDeliveryService: ReturnDeliveryService
  protected readonly returnDeliveryHistoryRepo_: typeof ReturnDeliveryHistoryRepository

  constructor(container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.returnDeliveryHistoryRepo_ = container.returnDeliveryHistoryRepository
    this.returnDeliveryService = container.returnDeliveryService
  }

  async listHistory(id: string, config: FindConfig<ReturnDeliveryHistory>) {
    const returnDeliveryHistoryRepo_ = this.manager_.getCustomRepository(
      this.returnDeliveryHistoryRepo_,
    )
    const query = buildQuery(
      { return_delivery_id: id },
      { ...config, relations: ['creator'] },
    )

    return await returnDeliveryHistoryRepo_.findAndCount(query)
  }

  async create_(createdBy: string, id: string) {
    return await this.atomicPhase_(async (manager) => {
      const returnDeliveryHistoryRepo_ = manager.getCustomRepository(
        this.returnDeliveryHistoryRepo_,
      )

      const data = await this.returnDeliveryService.retrieve_(id)
      const history = returnDeliveryHistoryRepo_.create({
        return_delivery_id: id,
        created_by: createdBy,
        metadata: _.omit(data, ['id']),
      })
      return await returnDeliveryHistoryRepo_.save(history)
    })
  }

  async retrieve_(id: string) {
    const returnDeliveryHistoryRepo_ = this.manager_.getCustomRepository(
      this.returnDeliveryHistoryRepo_,
    )
    const history = returnDeliveryHistoryRepo_.findOne({
      where: { id },
    })
    return history
  }
}
