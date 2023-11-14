import { Module } from 'medusa-extender'

import { SearchHistory } from './entity/search-history.entity'
import { SearchMigration1677339032326 } from './migrations/1677339032326-search.migration'
import { SearchHistoryRepository } from './repository/search-history.repository'
import { SearchRouter } from './search.router'
import { ProductSearchService } from './services/product-search.service'
import { SearchHistoryService } from './services/search-history.service'

@Module({
  imports: [
    SearchRouter,
    ProductSearchService,
    SearchHistory,
    SearchMigration1677339032326,
    SearchHistoryService,
    SearchHistoryRepository,
  ],
})
export class SearchModule {}
