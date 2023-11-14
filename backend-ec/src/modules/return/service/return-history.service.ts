import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ReturnHistory } from '../entities/return-history.entity'
import { ReturnHistoryRepository } from '../repository/return-history.repository'
import { ReturnService } from './return.service'
import { defaultReturnRelations } from './return-search.service'

type InjectedDependencies = {
  manager: EntityManager
  returnHistoryRepository: typeof ReturnHistoryRepository
  returnService: ReturnService
}

@Service()
export class ReturnHistoryService extends TransactionBaseService {
  static resolutionKey = 'returnHistoryService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected readonly returnHistoryRepo_: typeof ReturnHistoryRepository
  protected returnService_: ReturnService

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.returnHistoryRepo_ = container.returnHistoryRepository
    this.returnService_ = container.returnService
  }

  async listHistory(id: string, config: FindConfig<ReturnHistory>) {
    const returnHistoryRepo_ = this.manager_.getCustomRepository(
      this.returnHistoryRepo_,
    )
    const query = buildQuery(
      { return_id: id },
      { ...config, relations: ['creator'] },
    )

    return await returnHistoryRepo_.findAndCount(query)
  }

  async create_(createdBy: string, id: string) {
    return await this.atomicPhase_(async (manager) => {
      const returnHistoryRepo_ = manager.getCustomRepository(
        this.returnHistoryRepo_,
      )

      const data = await this.returnService_.retrieve(id, {
        relations: [...defaultReturnRelations, 'order.customer'],
      })
      const history = returnHistoryRepo_.create({
        return_id: id,
        created_by: createdBy,
        metadata: _.omit(data, ['id']),
      })
      return await returnHistoryRepo_.save(history)
    })
  }

  async getOne(id: string) {
    const returnHistoryRepo_ = this.manager_.getCustomRepository(
      this.returnHistoryRepo_,
    )
    const history = returnHistoryRepo_.findOne({
      where: { id },
    })
    return history
  }
}
