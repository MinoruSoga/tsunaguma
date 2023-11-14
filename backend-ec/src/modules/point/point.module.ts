import { Module } from 'medusa-extender'

import { UserPoint } from './entities/user-point.entity'
import { UserPointHistory } from './entities/user-point-history.entity'
import { PointMigration1667155010986 } from './migrations/1667155010986-point.migration'
import { PointMigration1671165462215 } from './migrations/1671165462215-point.migration'
import { PointMigration1676553534249 } from './migrations/1676553534249-point.migration'
import { PointRouter } from './point.router'
import { UserPointRepository } from './repository/user-point.repository'
import { UserPointHistoryRepository } from './repository/user-point-history.repository'
import { PointService } from './services/point.service'

@Module({
  imports: [
    PointRouter,
    UserPointHistory,
    UserPoint,
    PointMigration1667155010986,
    UserPointHistoryRepository,
    UserPointRepository,
    PointService,
    PointMigration1671165462215,
    PointMigration1676553534249,
  ],
})
export class PointModule {}
