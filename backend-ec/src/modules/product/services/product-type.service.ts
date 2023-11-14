import { ProductTypeService as MedusaProductTypeService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { CacheService } from 'src/modules/cache/cache.service'
import { EntityManager, IsNull } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { PostProductTypeBody } from '../controllers/product-type/create-category.cms.admin.controller'
import { PutProductTypeBody } from '../controllers/product-type/update-category.cms.admin.controller'
import { Product } from '../entity/product.entity'
import { ProductType } from '../entity/product-type.entity'
import ProductRepository from '../repository/product.repository'
import ProductTypeRepository from '../repository/product-type.repository'

type InjectedDependencies = {
  manager: EntityManager
  productTypeRepository: typeof ProductTypeRepository
  logger: Logger
  cacheService: CacheService
  productRepository: typeof ProductRepository
}

@Service({ override: MedusaProductTypeService })
export class ProductTypeService extends MedusaProductTypeService {
  protected readonly typeRepository_: typeof ProductTypeRepository
  protected readonly productRepo_: typeof ProductRepository
  protected readonly logger: Logger
  protected readonly cacheService_: CacheService

  constructor(private readonly container: InjectedDependencies) {
    super(container)
    this.container = container
    this.logger = container.logger
    this.cacheService_ = container.cacheService
    this.productRepo_ = container.productRepository
    this.typeRepository_ = container.productTypeRepository
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ProductTypeService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductTypeService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async listAll(
    selector: Selector<ProductType> & { deep?: number } = {},
    config: FindConfig<ProductType>,
  ) {
    const mConfig = loadConfig()
    const { deep = 3 } = selector

    if (!selector.parent_id) selector.parent_id = null

    delete selector.deep
    const query = buildQuery(selector, { ...config, order: { rank: 'ASC' } })

    const cacheKey = deep === 3 ? mConfig.cache.productTypes(query.where) : null

    let types: ProductType[]
    if (cacheKey) {
      types = await this.cacheService_.get(cacheKey)
      if (types) {
        return types
      }
    }
    const typeRepo = this.manager_.getCustomRepository(this.typeRepository_)
    types = await typeRepo.find(query)
    if (deep > 1) {
      const childs = await Promise.all(
        types.map(({ id }) =>
          this.listAll({ ...selector, deep: deep - 1, parent_id: id }, config),
        ),
      )
      types.forEach((prodType, idx) => (prodType.children = childs[idx]))
    }

    if (cacheKey) {
      await this.cacheService_.set(cacheKey, types)
    }

    return types
  }

  async retrieveAll(id: string): Promise<ProductType> {
    const cacheKey = `prod-type-${id}`
    let prodType = await this.cacheService_.get<ProductType>(cacheKey)
    if (prodType) {
      return prodType
    }
    const typeRepo = this.manager_.getCustomRepository(this.typeRepository_)
    prodType = await typeRepo.findOne(id)
    if (!prodType) {
      return undefined
    }

    if (prodType.parent_id) {
      prodType.parent = await this.retrieveAll(prodType.parent_id)
    }

    await this.cacheService_.set(cacheKey, prodType, 300)

    return prodType
  }

  async create(data: PostProductTypeBody): Promise<ProductType> {
    const typeRepo = this.manager_.getCustomRepository(this.typeRepository_)

    if (data.parent_id) {
      const raw = await typeRepo.count({ id: data.parent_id })

      if (!raw) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `The product-type with id ${data.parent_id} not found!`,
        )
      }

      let rank = await typeRepo.count({ parent_id: data.parent_id })

      if (!rank) {
        rank = 0
      }
      const toCreate = typeRepo.create({
        value: data.value,
        parent_id: data.parent_id,
        rank: rank + 1,
      })

      const result = await typeRepo.save(toCreate)

      await this.cacheService_.clearCache(['product-types*'])

      return result
    } else {
      const rank = await typeRepo.count({ parent_id: IsNull() })

      const toCreate = typeRepo.create({
        value: data.value,
        rank: rank + 1,
      })

      const result = await typeRepo.save(toCreate)

      await this.cacheService_.clearCache(['product-types*'])

      return result
    }
  }

  async update(id: string, data: PutProductTypeBody): Promise<ProductType> {
    const typeRepo = this.manager_.getCustomRepository(this.typeRepository_)
    const tmp = await typeRepo.findOne(id)

    if (data.parent_id) {
      const raw = await typeRepo.count({ id: data.parent_id })

      if (!raw) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `The product-type with id ${data.parent_id} not found!`,
        )
      }

      let rank = await typeRepo.count({ parent_id: data.parent_id })

      if (!rank) {
        rank = 0
      }

      const result = await typeRepo.save({
        ...Object.assign(tmp, data),
        rank: rank + 1,
      })

      await this.cacheService_.clearCache(['product-types*'])

      return result
    } else {
      const rank = await typeRepo.count({ parent_id: IsNull() })

      const result = await typeRepo.save({
        ...Object.assign(tmp, data),
        rank: rank + 1,
      })

      await this.cacheService_.clearCache(['product-types*'])

      return result
    }
  }

  async delete(id: string) {
    return await this.atomicPhase_(async (tx) => {
      const typeRepo = tx.getCustomRepository(this.typeRepository_)
      const productRepo = tx.getCustomRepository(this.productRepo_)

      const selector: Selector<Product> = {}
      const config: FindConfig<Product> = {}
      const query = buildQuery(selector, config)

      query.where = [
        {
          type_id: id,
        },
        {
          type_lv1_id: id,
        },
        {
          type_lv2_id: id,
        },
      ]

      const data = await productRepo.find(query)

      if (data.length > 0) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `The product-type has been used for ${data.length} products, can't be deleted`,
        )
      }

      await this.cacheService_.clearCache(['product-types*'])

      return await typeRepo.delete(id)
    })
  }
}
