import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { StoreHistory } from '../entity/store-history.entity'
import { StoreHistoryRepository } from '../repository/store-history.repository'
import StoreService from './store.service'

type InjectedDependencies = {
  manager: EntityManager
  storeHistoryRepository: typeof StoreHistoryRepository
  storeService: StoreService
}

@Service()
export class StoreHistoryService extends TransactionBaseService {
  static resolutionKey = 'storeHistoryService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected readonly storeHistoryRepository_: typeof StoreHistoryRepository
  protected readonly storeService: StoreService

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.storeHistoryRepository_ = container.storeHistoryRepository
    this.storeService = container.storeService
  }

  async listHistory(storeId: string, config: FindConfig<StoreHistory>) {
    const storeHistoryRepo = this.manager_.getCustomRepository(
      this.storeHistoryRepository_,
    )
    const query = buildQuery(
      { store_id: storeId },
      { ...config, relations: ['creator'] },
    )

    return await storeHistoryRepo.findAndCount(query)
  }

  async create_(createdBy: string, storeId: string) {
    return await this.atomicPhase_(async (manager) => {
      const storeHistoryRepo = manager.getCustomRepository(
        this.storeHistoryRepository_,
      ) as StoreHistoryRepository

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = await this.storeService.retrieve_(storeId, {
        relations: ['store_detail', 'payback_setting', 'owner'],
      })

      const history = storeHistoryRepo.create({
        store_id: storeId,
        created_by: createdBy,
        metadata: rest,
      })
      return await storeHistoryRepo.save(history)
    })
  }

  async getOne(id: string) {
    const storeHistoryRepo_ = this.manager_.getCustomRepository(
      this.storeHistoryRepository_,
    )
    const history = storeHistoryRepo_.findOne({
      where: { id },
      relations: [
        'store',
        'store.customer',
        'store.owner',
        'store.store_detail',
        'store.payback_setting',
      ],
    })
    return history
  }
}
