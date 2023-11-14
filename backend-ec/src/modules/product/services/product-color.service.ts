import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { ProductColor } from '../entity/product-color.entity'
import { ProductColorRepository } from '../repository/product-color.repository'
import { CacheService } from './../../cache/cache.service'

type InjectedDependencies = {
  manager: EntityManager
  productColorRepository: typeof ProductColorRepository
  cacheService: CacheService
}

@Service()
export class ProductColorService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected cacheService_: CacheService
  static resolutionKey = 'productColorService'

  protected readonly productColorRepository_: typeof ProductColorRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.cacheService_ = container.cacheService
    this.productColorRepository_ = container.productColorRepository
  }

  async listAll(
    selector: Selector<ProductColor>,
    config: FindConfig<ProductColor>,
  ) {
    const cacheKey = loadConfig().cache.productColors

    // check if data has already been saved in redis or not
    const cacheData = await this.cacheService_.get(cacheKey)
    if (cacheData) return cacheData

    const colorRepo = this.manager_.getCustomRepository(
      this.productColorRepository_,
    )

    const query = buildQuery(selector, config)

    const data = await colorRepo.find(query)

    // save cache to redis
    await this.cacheService_.set(cacheKey, data)

    return data
  }
}
