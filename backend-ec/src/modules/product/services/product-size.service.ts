import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { ProductSize } from '../entity/product-size.entity'
import { ProductSizeRepository } from '../repository/product-size.repository'
import { CacheService } from './../../cache/cache.service'

type InjectedDependencies = {
  manager: EntityManager
  productSizeRepository: typeof ProductSizeRepository
  cacheService: CacheService
}

@Service()
export class ProductSizeService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected cacheService_: CacheService
  static resolutionKey = 'productSizeService'

  protected readonly productSizeRepository_: typeof ProductSizeRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.cacheService_ = container.cacheService
    this.manager_ = container.manager
    this.productSizeRepository_ = container.productSizeRepository
  }

  async listAll(
    selector: Selector<ProductSize>,
    config: FindConfig<ProductSize>,
  ) {
    const mConfig = loadConfig()
    const cacheKey = mConfig.cache.productSizes(selector)

    const cacheData = await this.cacheService_.get(cacheKey)
    if (cacheData) return cacheData

    const sizeRepo = this.manager_.getCustomRepository(
      this.productSizeRepository_,
    )

    const query = buildQuery(selector, config)

    const data = await sizeRepo.find(query)
    await this.cacheService_.set(cacheKey, data)
    return data
  }
}
