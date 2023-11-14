import { Module } from 'medusa-extender'

import { DeliveryRequestRouter } from './delivery-request.router'
import { DeliveryRequest } from './entities/delivery-request.entity'
import { DeliveryRequestHistory } from './entities/delivery-request-history.entity'
import { DeliveryRequestVariant } from './entities/delivery-request-variant.entity'
import { DeliveryRequestMigration1681293090807 } from './migrations/1681293090807-delivery-request.migration'
import { DeliveryRequestMigration1681368262661 } from './migrations/1681368262661-delivery-request.migration'
import { DeliveryRequestMigration1681373393637 } from './migrations/1681373393637-delivery-request.migration'
import { DeliveryRequestMigration1681889133676 } from './migrations/1681889133676-delivery-request.migration'
import { DeliveryRequestMigration1682479836704 } from './migrations/1682479836704-delivery-request.migration'
import { DeliveryRequestMigration1685374602610 } from './migrations/1685374602610-delivery-request.migration'
import { DeliveryRequestMigration1685527828904 } from './migrations/1685527828904-delivery-request.migration'
import { DeliveryRequestVariantMigration1685595059506 } from './migrations/1685595059506-delivery-request.migration'
import { DeliveryRequestRepository } from './repository/delivery-request.repository'
import { DeliveryRequestHistoryRepository } from './repository/delivery-request-history.repository'
import { DeliveryRequestVariantRepository } from './repository/delivery-request-variant.repository'
import DeliveryRequestService from './services/delivery-request.service'
import { DeliveryRequestHistoryService } from './services/delivery-request-history.service'
import { DeliveryRequestSearchService } from './services/delivery-request-search.service'
import { DeliveryRequestSubscriber } from './subscribers/delivery-request.subscriber'

@Module({
  imports: [
    DeliveryRequest,
    DeliveryRequestRepository,
    DeliveryRequestService,
    DeliveryRequestRouter,
    DeliveryRequestMigration1681293090807,
    DeliveryRequestMigration1681368262661,
    DeliveryRequestVariant,
    DeliveryRequestVariantRepository,
    DeliveryRequestMigration1681373393637,
    DeliveryRequestSubscriber,
    DeliveryRequestSearchService,
    DeliveryRequestMigration1681889133676,
    DeliveryRequestHistoryService,
    DeliveryRequestHistoryRepository,
    DeliveryRequestHistory,
    DeliveryRequestMigration1682479836704,
    DeliveryRequestMigration1685374602610,
    DeliveryRequestMigration1685527828904,
    DeliveryRequestVariantMigration1685595059506,
  ],
})
export class DeliveryRequestModule {}
