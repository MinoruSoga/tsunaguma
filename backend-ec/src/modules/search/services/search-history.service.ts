import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, IsNull } from 'typeorm'

import { AddSearchHistoryReq } from '../controllers/add-new-query-search.store.controller'
import { SearchHistory } from '../entity/search-history.entity'
import { SearchHistoryRepository } from '../repository/search-history.repository'

type InjectedDependencies = {
  manager: EntityManager
  logger: Logger
  searchHistoryRepository: typeof SearchHistoryRepository
}

@Service()
export class SearchHistoryService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'searchHistoryService'

  private readonly logger: Logger
  protected searchHistoryRepo_: typeof SearchHistoryRepository

  constructor(container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.logger = container.logger

    this.searchHistoryRepo_ = container.searchHistoryRepository
  }

  async create(data: AddSearchHistoryReq) {
    return this.atomicPhase_(async (tx) => {
      const searchHistoryRepo = tx.getCustomRepository(this.searchHistoryRepo_)

      const isExist = await searchHistoryRepo.findOne(data)
      if (isExist) {
        isExist.created_at = new Date()
        await searchHistoryRepo.save(isExist)
      } else {
        await searchHistoryRepo.save(searchHistoryRepo.create(data))
      }
    })
  }

  async sync(tmpUserId: string, userId: string) {
    return this.atomicPhase_(async (tx) => {
      const searchHistoryRepo = tx.getCustomRepository(this.searchHistoryRepo_)

      // find search history of that tmp user id which do not belong to any user or belong to this user
      const res = await searchHistoryRepo.find({
        where: [
          {
            tmp_user_id: tmpUserId,
            user_id: IsNull(),
          },
          {
            tmp_user_id: tmpUserId,
            user_id: userId,
          },
        ],
      })

      await Promise.all(
        res.map(async (sh) => {
          // find of this user already search this content or not
          const isExist = await searchHistoryRepo.findOne({
            content: sh.content,
            user_id: userId,
          })

          if (!isExist) {
            // update user id of this search content
            await searchHistoryRepo.update({ id: sh.id }, { user_id: userId })
          } else if (isExist.created_at < sh.created_at) {
            await searchHistoryRepo.update(
              { id: isExist.id },
              { created_at: sh.created_at },
            )
          }
        }),
      )
    })
  }

  async list(
    selector: Selector<SearchHistory>,
    config: FindConfig<SearchHistory>,
  ) {
    const searchHistoryRepo = this.manager_.getCustomRepository(
      this.searchHistoryRepo_,
    )

    const tmpUserId = selector.tmp_user_id
    const userId = selector.user_id
    const offset = config.skip || 0
    const limit = config.take || 15
    if (!userId && !tmpUserId)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Tmp user id or user is is required !',
      )

    const condition = tmpUserId
      ? { tmp_user_id: tmpUserId }
      : { user_id: userId }

    // const result = await searchHistoryRepo
    //   .createQueryBuilder()
    //   .where(condition)
    //   .distinctOn(['content'])
    //   .getMany()
    // const ids = result.map((s) => s.id)

    return await searchHistoryRepo
      .createQueryBuilder()
      .where(condition)
      // .where({ id: In(ids) })
      .offset(offset)
      .limit(limit)
      .orderBy({ created_at: 'DESC' })
      .getMany()
  }
}
