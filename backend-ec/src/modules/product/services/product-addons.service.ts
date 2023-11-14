import { TransactionBaseService } from '@medusajs/medusa'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ProductAddons } from '../entity/product-addons.entity'
import { ProductAddonsRepository } from '../repository/product-addons.repository'

type InjectedDependencies = {
  manager: EntityManager
  productAddonsRepository: typeof ProductAddonsRepository
}

@Service()
export class ProductAddonsService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  static resolutionKey = 'productAddonsService'

  protected readonly productAddonsRepository_: typeof ProductAddonsRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.productAddonsRepository_ = container.productAddonsRepository
  }

  async getProductAddons(productId: string): Promise<ProductAddons[]> {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonsRepository_,
    )

    const qb = productAddonRepo.createQueryBuilder('pa')

    qb.where('pa.product_id = :productId', { productId })
    qb.leftJoinAndSelect('pa.lv1', 'pa_lv1')
    qb.leftJoinAndSelect('pa_lv1.children', 'pa_lv1_children')
    qb.leftJoinAndSelect('pa.lv2', 'pa_lv2')
    qb.orderBy('pa.rank', 'ASC')

    return await qb.getMany()
  }
}
