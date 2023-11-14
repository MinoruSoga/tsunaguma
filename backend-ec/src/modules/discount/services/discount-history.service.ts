import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { DiscountHistory } from '../entities/discount-history.entity'
import { DiscountRepository } from '../repository/discount.repository'
import { DiscountHistoryRepository } from '../repository/discount-history.repository'

type InjectedDependencies = {
  manager: EntityManager
  discountHistoryRepository: typeof DiscountHistoryRepository
  discountRepository: typeof DiscountRepository
}

export const defaultDiscountRelations = [
  'rule',
  'parent_discount',
  'rule.conditions',
  'rule.conditions.product_types',
  'rule.conditions.products',
  'rule.conditions.store_groups',
  'rule.conditions.store_groups.stores',
  'rule.conditions.customer_groups',
  'rule.conditions.customer_groups.customers',
]

@Service()
export class DiscountHistoryService extends TransactionBaseService {
  protected transactionManager_: EntityManager
  static resolutionKey = 'discountHistoryService'
  protected readonly manager_: EntityManager
  protected container_: InjectedDependencies
  protected readonly discountHistoryRepo_: typeof DiscountHistoryRepository
  protected readonly discountRepo_: typeof DiscountRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.discountHistoryRepo_ = container.discountHistoryRepository
    this.discountRepo_ = container.discountRepository
  }

  async listHistory(discountId: string, config: FindConfig<DiscountHistory>) {
    const discountHistoryRepo_ = this.manager_.getCustomRepository(
      this.discountHistoryRepo_,
    )
    const query = buildQuery(
      { discount_id: discountId },
      { ...config, relations: ['creator'] },
    )

    return await discountHistoryRepo_.findAndCount(query)
  }

  async create(discountId: string, userId: string) {
    const discountHisRepo = this.manager_.getCustomRepository(
      this.discountHistoryRepo_,
    )

    const discountRepo = this.manager_.getCustomRepository(this.discountRepo_)

    const data = await discountRepo.findOne(
      { id: discountId },
      {
        relations: defaultDiscountRelations,
      },
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data

    const history = discountHisRepo.create({
      discount_id: discountId,
      metadata: rest,
      created_by: userId,
    })
    return await discountHisRepo.save(history)
  }

  async retrieve_(id: string): Promise<DiscountHistory> {
    return await this.atomicPhase_(async (manager) => {
      const discountHistoryRepo = manager.getCustomRepository(
        this.discountHistoryRepo_,
      ) as DiscountHistoryRepository

      return await discountHistoryRepo.findOne({ id })
    })
  }
}
