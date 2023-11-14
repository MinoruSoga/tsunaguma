import { Module } from 'medusa-extender'

import { CacheRouter } from './cache.router'
import { CacheService } from './cache.service'

@Module({
  imports: [CacheService, CacheRouter],
})
export class CacheModule {}
