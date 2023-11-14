import { Logger } from '@medusajs/medusa/dist/types/global'
import { Service } from 'medusa-extender'
import { MeiliSearch, Pagination } from 'meilisearch'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'

type InjectedDependencies = {
  manager: EntityManager
  logger: Logger
}

@Service()
export class ProductSearchService {
  static resolutionKey = 'productSearchService'
  private client_: MeiliSearch

  static TNG_SEARCH_INDEX_EVENT = 'TNG_SEARCH_INDEX_EVENT'

  private readonly manager: EntityManager
  private readonly logger: Logger

  constructor({ manager, logger }: InjectedDependencies) {
    this.manager = manager
    this.logger = logger

    const config = loadConfig()
    this.client_ = new MeiliSearch({
      host: config.meiliSearch.host,
      apiKey: config.meiliSearch.apiKey,
    })
  }

  async getSearchKeys(pagination?: Pagination) {
    try {
      return await this.client_.getKeys(pagination)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  async getSearchHealth() {
    try {
      return await this.client_.health()
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }
}
