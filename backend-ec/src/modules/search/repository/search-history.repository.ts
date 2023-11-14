import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { SearchHistory } from '../entity/search-history.entity'

@MedusaRepository()
@EntityRepository(SearchHistory)
export class SearchHistoryRepository extends Repository<SearchHistory> {}
