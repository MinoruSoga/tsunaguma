import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager, IsNull } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { PostProductSpecBody } from '../controllers/product-spec/create-spec.cms.admin.controller'
import { PutProductSpecBody } from '../controllers/product-spec/update-spec.cms.admin.controller'
import { ProductSpec } from '../entity/product-spec.entity'
import { ProductSpecRepository } from '../repository/product-spec.repository'
import { CacheService } from './../../cache/cache.service'

type InjectedDependencies = {
  manager: EntityManager
  productSpecRepository: typeof ProductSpecRepository
  cacheService: CacheService
}

@Service()
export class ProductSpecService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected cacheService_: CacheService
  static resolutionKey = 'productSpecService'

  protected readonly productSpecRepository_: typeof ProductSpecRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.cacheService_ = container.cacheService
    this.manager_ = container.manager
    this.productSpecRepository_ = container.productSpecRepository
  }

  async listAll(
    selector: Selector<ProductSpec> & { deep?: number } = {},
    config: FindConfig<ProductSpec>,
  ) {
    const mConfig = loadConfig()
    const specRepo = this.manager_.getCustomRepository(
      this.productSpecRepository_,
    )
    const { deep = 3 } = selector
    delete selector.deep
    let query = buildQuery(selector, config)
    if (!selector.parent_id) {
      query = buildQuery({ ...selector, parent_id: IsNull() }, config)
    }

    const cacheKey = deep === 3 ? mConfig.cache.productSpecs(query.where) : null

    if (cacheKey) {
      const cacheData: ProductSpec[] = await this.cacheService_.get(cacheKey)
      if (cacheData) return cacheData
    }

    const specs = await specRepo.find(query)
    if (deep > 1) {
      const childs = await Promise.all(
        specs.map(({ id }) =>
          this.listAll({ ...selector, deep: deep - 1, parent_id: id }, config),
        ),
      )
      specs.forEach((prodSpec, idx) => (prodSpec.children = childs[idx]))
    }

    if (cacheKey) {
      await this.cacheService_.set(cacheKey, specs)
    }

    return specs
  }

  async create(data: PostProductSpecBody) {
    return await this.atomicPhase_(async (tx) => {
      const specRepo = tx.getCustomRepository(this.productSpecRepository_)

      const toCreate = specRepo.create(data)
      await this.cacheService_.clearCache(['product-specs*'])
      return await specRepo.save(toCreate)
    })
  }

  async update(id: string, data: PutProductSpecBody) {
    return await this.atomicPhase_(async (tx) => {
      const specRepo = tx.getCustomRepository(this.productSpecRepository_)

      const tmp = await specRepo.findOne(id)
      const result = await specRepo.save(Object.assign(tmp, data))
      await this.cacheService_.clearCache(['product-specs*'])
      return result
    })
  }

  async delete(id: string) {
    const specRepo = this.manager_.getCustomRepository(
      this.productSpecRepository_,
    )

    await this.cacheService_.clearCache(['product-specs*'])
    return await specRepo.delete(id)
  }
}
