import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { PostProductMaterialBody } from '../controllers/product-material/create-material.cms.admin.controller'
import { PutProductMaterialBody } from '../controllers/product-material/update-material.cms.admin.controller'
import { Product } from '../entity/product.entity'
import { ProductMaterial } from '../entity/product-material.entity'
import ProductRepository from '../repository/product.repository'
import { ProductMaterialRepository } from '../repository/product-material.repository'
import { CacheService } from './../../cache/cache.service'

type InjectedDependencies = {
  manager: EntityManager
  productMaterialRepository: typeof ProductMaterialRepository
  cacheService: CacheService
  productRepository: typeof ProductRepository
}

@Service()
export class ProductMaterialService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  static resolutionKey = 'productMaterialService'
  protected cacheService_: CacheService

  protected readonly productMaterialRepository_: typeof ProductMaterialRepository
  protected readonly productRepo_: typeof ProductRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.cacheService_ = container.cacheService
    this.manager_ = container.manager
    this.productMaterialRepository_ = container.productMaterialRepository
    this.productRepo_ = container.productRepository
  }

  async listAll(
    selector: Selector<ProductMaterial>,
    config: FindConfig<ProductMaterial>,
  ) {
    const mConfig = loadConfig()

    const cacheData = await this.cacheService_.get(
      mConfig.cache.productMaterials(selector),
    )
    if (cacheData) return cacheData

    const materialRepo = this.manager_.getCustomRepository(
      this.productMaterialRepository_,
    )

    const query = buildQuery(selector, config)

    const data = await materialRepo.find(query)
    await this.cacheService_.set(mConfig.cache.productMaterials(selector), data)
    return data
  }

  async create(data: PostProductMaterialBody): Promise<ProductMaterial> {
    const materialRepo = this.manager_.getCustomRepository(
      this.productMaterialRepository_,
    )

    const toCreate = materialRepo.create({
      product_type_id: data.type_id,
      name: data.name,
    })

    await this.cacheService_.clearCache(['product-materials*'])
    return await materialRepo.save(toCreate)
  }

  async update(
    id: string,
    data: PutProductMaterialBody,
  ): Promise<ProductMaterial> {
    const materialRepo = this.manager_.getCustomRepository(
      this.productMaterialRepository_,
    )

    const tmp = await materialRepo.findOne(id)
    const result = await materialRepo.save(Object.assign(tmp, data))

    await this.cacheService_.clearCache(['product-materials*'])

    return result
  }

  async delete(id: string) {
    const materialRepo = this.manager_.getCustomRepository(
      this.productMaterialRepository_,
    )

    const productRepo = this.manager_.getCustomRepository(this.productRepo_)

    const selector: Selector<Product> = {
      material_id: id,
    }
    const config: FindConfig<Product> = {}
    const query = buildQuery(selector, config)
    const data = await productRepo.find(query)

    if (data.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `The product-material has been used for ${data.length} products, can't be deleted`,
      )
    }
    await this.cacheService_.clearCache(['product-materials*'])
    return await materialRepo.delete(id)
  }
}
