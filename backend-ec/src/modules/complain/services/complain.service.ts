import { TransactionBaseService } from '@medusajs/medusa'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import ProductRepository from '../../product/repository/product.repository'
import { Complain } from '../complain.entity'
import { ComplainRepository } from '../repository/complain.repository'

interface InjectedDependencies {
  manager: EntityManager
  complainRepository: typeof ComplainRepository
  productRepository: typeof ProductRepository
}

@Service()
export class ComplainService extends TransactionBaseService {
  static resolutionKey = 'complainService'
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected complainRepository_: typeof ComplainRepository
  protected productRepository_: typeof ProductRepository

  constructor(private readonly container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.complainRepository_ = container.complainRepository
    this.productRepository_ = container.productRepository
  }

  public async create(
    productId: string,
    reason: string,
    reasonType: string,
    userId: string,
  ) {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_,
    )
    const complainRepo = this.manager_.getCustomRepository(
      this.complainRepository_,
    )

    const product = await productRepo.findOne(productId)
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id: ${productId} was not found`,
      )
    }

    const data: DeepPartial<Complain> = {
      user_id: userId,
      product_id: productId,
      store_id: product.store_id,
      metadata: { reasonType: reasonType },
      reason: reason,
    }
    const createdData = await complainRepo.create(data)

    return await complainRepo.save(createdData)
  }
}
