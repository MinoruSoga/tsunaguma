import { Module } from 'medusa-extender'

import { SeqMigration1671519306652 } from './migrations/1671519306652-seq.migration'
import { SeqMaster } from './seq.entity'
import { SeqMasterRepository } from './seq.repository'
import { SeqService } from './seq.service'

@Module({
  imports: [
    SeqMigration1671519306652,
    SeqMaster,
    SeqMasterRepository,
    SeqService,
  ],
})
export class SeqModule {}
