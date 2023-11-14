import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { Postcode } from '../entity/postcode.entity'
import { PostcodeRepository } from '../repository/postcode.repository'

type InjectedDependencies = {
  manager: EntityManager
  postcodeRepository: typeof PostcodeRepository
}

@Service()
export class PostcodeService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'postcodeService'

  protected readonly postcodeRepository_: typeof PostcodeRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.postcodeRepository_ = container.postcodeRepository
  }

  async retrieve(
    code: string,
    config: FindConfig<Postcode> = {},
  ): Promise<Postcode | never> {
    const postcodeRepo = this.manager_.getCustomRepository(
      this.postcodeRepository_,
    )

    const query = buildQuery<Pick<Postcode, 'id'>, Postcode>(
      { id: code },
      config,
    )
    const data = await postcodeRepo.findOne(query)

    if (!data) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `post code with ${code} was not found`,
      )
    }

    return data
  }
}
