import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { Prefecture } from '../entity/prefecture.entity'
import { PrefectureRepository } from '../repository/prefecture.repository'

type InjectedDependencies = {
  manager: EntityManager
  prefectureRepository: typeof PrefectureRepository
}

@Service()
export class PrefectureService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'prefectureService'

  protected readonly prefectureRepository_: typeof PrefectureRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.prefectureRepository_ = container.prefectureRepository
  }

  async list(areaId?: string): Promise<Prefecture[]> {
    const prefRepo = this.manager_.getCustomRepository(
      this.prefectureRepository_,
    )
    const pref = prefRepo.createQueryBuilder('pref')

    pref.leftJoin('pref.children', 'pref_child')
    pref.select(['pref.id', 'pref.name'])
    pref.addSelect(['pref_child.id', 'pref_child.name', 'pref_child.parent_id'])

    if (areaId) {
      pref.where('pref.parent_id = :parentId', { parentId: areaId })
    } else {
      pref.where('pref.parent_id IS NULL')
    }
    return await pref.getMany()
  }

  async retrieve(
    areaId: string,
    config: FindConfig<Prefecture> = {},
  ): Promise<Prefecture | never> {
    const prefRepo = this.manager_.getCustomRepository(
      this.prefectureRepository_,
    )

    const query = buildQuery<Pick<Prefecture, 'id'>, Prefecture>(
      { id: areaId },
      config,
    )
    const area = await prefRepo.findOne(query)

    if (!area) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Area with ${areaId} was not found`,
      )
    }

    return area
  }
}
