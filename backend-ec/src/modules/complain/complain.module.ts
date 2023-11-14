import { Module } from 'medusa-extender'

import { Complain } from './complain.entity'
import { ComplainRouter } from './complain.router'
import { ComplainMigration1667445322525 } from './migrations/1667445322525-complain.migration'
import { ComplainRepository } from './repository/complain.repository'
import { ComplainService } from './services/complain.service'

@Module({
  imports: [
    Complain,
    ComplainMigration1667445322525,
    ComplainRouter,
    ComplainService,
    ComplainRepository,
  ],
})
export class ComplainModule {}
