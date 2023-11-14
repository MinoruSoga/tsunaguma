import { Module } from 'medusa-extender'

import { PaybackSetting } from './entity/payback-setting.entity'
import { ProductAddon } from './entity/product-addon.entity'
import { Store } from './entity/store.entity'
import { StoreBilling } from './entity/store_billing.entity'
import { StoreDetail } from './entity/store-detail.entity'
import { StoreHistory } from './entity/store-history.entity'
import { StoreMigration1666956520885 } from './migrations/1666956520885-store.migration'
import { StoreMigration1667148102823 } from './migrations/1667148102823-store.migration'
import { StoreMigration1667188798244 } from './migrations/1667188798244-store.migration'
import { StoreMigration1668499045392 } from './migrations/1668499045392-store.migration'
import { StoreMigration1669339495364 } from './migrations/1669339495364-store.migration'
import { StoreMigration1669625319180 } from './migrations/1669625319180-store.migration'
import { StoreMigration1669694772202 } from './migrations/1669694772202-store.migration'
import { StoreMigration1669717908037 } from './migrations/1669717908037-store.migration'
import { StoreMigration1671112628425 } from './migrations/1671112628425-store.migration'
import { StoreMigration1671471210192 } from './migrations/1671471210192-store.migration'
import { StoreMigration1671932519924 } from './migrations/1671932519924-store.migration'
import { StoreMigration1672219570982 } from './migrations/1672219570982-store.migration'
import { StoreMigration1672371020971 } from './migrations/1672371020971-store.migration'
import { StoreMigration1672643230760 } from './migrations/1672643230760-store.migration'
import { StoreMigration1672825400477 } from './migrations/1672825400477-store.migration'
import { StoreMigration1673922723520 } from './migrations/1673922723520-store.migration'
import { StoreMigration1676719430295 } from './migrations/1676719430295-store.migration'
import { StoreMigration1677472172363 } from './migrations/1677472172363-store.migration'
import { StoreMigration1678787784186 } from './migrations/1678787784186-store.migration'
import { StoreMigration1678790133001 } from './migrations/1678790133001-store.migration'
import { StoreMigration1678954809815 } from './migrations/1678954809815-store.migration'
import { PaybackSettingRepository } from './repository/payback-setting.repository'
import { ProductAddonRepository } from './repository/product-addon.repository'
import StoreRepository from './repository/store.repository'
import { StoreBillingRepository } from './repository/store-billing.repository'
import { StoreDetailRepository } from './repository/store-detail.repository'
import { StoreHistoryRepository } from './repository/store-history.repository'
import { PaybackSettingService } from './services/payback-setting.service'
import { ProductAddonService } from './services/product-addon.service'
import StoreService from './services/store.service'
import { StoreDetailService } from './services/store-detail.service'
import { StoreHistoryService } from './services/store-history.service'
import { StoreSearchService } from './services/store-search.service'
import { StoreRouter } from './store.router'

@Module({
  imports: [
    Store,
    StoreRepository,
    StoreService,
    StoreDetail,
    StoreRouter,
    StoreDetailRepository,
    StoreDetailService,
    ProductAddon,
    StoreMigration1666956520885,
    StoreMigration1667148102823,
    StoreMigration1667188798244,
    ProductAddonRepository,
    ProductAddonService,
    StoreMigration1668499045392,
    StoreMigration1669339495364,
    StoreBilling,
    StoreBillingRepository,
    PaybackSetting,
    PaybackSettingRepository,
    PaybackSettingService,
    StoreMigration1669625319180,
    StoreMigration1669694772202,
    StoreMigration1669717908037,
    StoreMigration1671112628425,
    StoreHistory,
    StoreHistoryRepository,
    StoreHistoryService,
    StoreMigration1671471210192,
    StoreMigration1671932519924,
    StoreMigration1672219570982,
    StoreMigration1672371020971,
    StoreMigration1672643230760,
    StoreMigration1672825400477,
    StoreMigration1673922723520,
    StoreMigration1676719430295,
    StoreMigration1677472172363,
    StoreSearchService,
    StoreMigration1678787784186,
    StoreMigration1678790133001,
    StoreMigration1678954809815,
  ],
})
export class StoreModule {}
