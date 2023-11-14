import { Module } from 'medusa-extender'

import { Return } from '../return/entities/return.entity'
import { ReturnDelivery } from './entities/return-delivery.entity'
import { ReturnDeliveryHistory } from './entities/return-delivery-history.entity'
import { ReturnDeliveryMigration1687405418448 } from './migrations/1687405418448-return-delivery.migration'
import { ReturnDeliveryRepository } from './repository/return-delivery.repository'
import { ReturnDeliveryHistoryRepository } from './repository/return-delivery-history.repository'
import { ReturnDeliveryRouter } from './return-delivery.router'
import { ReturnDeliveryService } from './service/return-delivery.service'
import { ReturnDeliveryHistoryService } from './service/return-delivery-history.service'
import { ReturnDeliverySearchService } from './service/return-delivery-search.service'

@Module({
  imports: [
    ReturnDeliveryRouter,
    Return,
    ReturnDeliveryMigration1687405418448,
    ReturnDelivery,
    ReturnDeliveryRepository,
    ReturnDeliveryHistoryService,
    ReturnDeliveryService,
    ReturnDeliverySearchService,
    ReturnDeliveryHistoryRepository,
    ReturnDeliveryHistory,
  ],
})
export class ReturnDeliveryModule {}
