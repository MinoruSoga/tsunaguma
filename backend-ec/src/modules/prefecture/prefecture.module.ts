import { Module } from 'medusa-extender'

import { Postcode } from './entity/postcode.entity'
import { Prefecture } from './entity/prefecture.entity'
import { PrefectureMigration1666547701891 } from './migrations/1666547701891-prefecture.migration'
import { PrefectureMigration1671109520458 } from './migrations/1671109520458-prefecture.migration'
import { PrefectureRouter } from './prefecture.router'
import { PostcodeRepository } from './repository/postcode.repository'
import { PrefectureRepository } from './repository/prefecture.repository'
import { PostcodeService } from './services/postcode.service'
import { PrefectureService } from './services/prefecture.service'

@Module({
  imports: [
    PrefectureMigration1666547701891,
    PrefectureMigration1671109520458,
    Prefecture,
    Postcode,
    PrefectureRepository,
    PostcodeRepository,
    PrefectureService,
    PostcodeService,
    PrefectureRouter,
  ],
})
export class PrefectureModule {}
