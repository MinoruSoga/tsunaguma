import { Module } from 'medusa-extender'

import { Return } from './entities/return.entity'
import { ReturnHistory } from './entities/return-history.entity'
import { ReturnMigration1682302747790 } from './migrations/1682302747790-return.migration'
import { ReturnMigration1686554537652 } from './migrations/1686554537652-return.migration'
import { ReturnMigration1686622996359 } from './migrations/1686622996359-return.migration'
import { ReturnMigration1686649378698 } from './migrations/1686649378698-return.migration'
import { ReturnRepository } from './repository/return.repository'
import { ReturnHistoryRepository } from './repository/return-history.repository'
import { ReturnRouter } from './return.router'
import { ReturnService } from './service/return.service'
import { ReturnHistoryService } from './service/return-history.service'
import { ReturnSearchService } from './service/return-search.service'

@Module({
  imports: [
    ReturnMigration1686554537652,
    ReturnMigration1682302747790,
    ReturnSearchService,
    ReturnRouter,
    Return,
    ReturnRepository,
    ReturnService,
    ReturnMigration1686622996359,
    ReturnHistoryService,
    ReturnHistoryRepository,
    ReturnHistory,
    ReturnMigration1686649378698,
  ],
})
export class ReturnModule {}
