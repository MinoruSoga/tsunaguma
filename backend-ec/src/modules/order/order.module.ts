import { Module } from 'medusa-extender'

import { Order } from './entity/order.entity'
import { OrderHistory } from './entity/order-history.entity'
import { OrderMigration1652101349791 } from './migrations/1652101349791-order.migration'
import { OrderMigration1668941018901 } from './migrations/1668941018901-order.migration'
import { OrderMigration1669049120613 } from './migrations/1669049120613-order.migration'
import { OrderMigration1669192893118 } from './migrations/1669192893118-order.migration'
import { OrderMigration1671165925071 } from './migrations/1671165925071-order.migration'
import { OrderMigration1671858926727 } from './migrations/1671858926727-order.migration'
import { OrderRouter } from './order.router'
import { OrderRepository } from './repository/order.repository'
import { OrderHistoryRepository } from './repository/order-history.repository'
import { OrderService } from './services/order.service'
import { OrderHistoryService } from './services/order-history.service'
import { OrderSearchService } from './services/order-search.service'
import { PaymentProviderService } from './services/payment-provider.service'
import { OrderSubscriber } from './subscribers/order.subscriber'

@Module({
  imports: [
    Order,
    OrderRepository,
    OrderService,
    OrderSubscriber,
    OrderMigration1652101349791,
    OrderMigration1668941018901,
    OrderMigration1669049120613,
    PaymentProviderService,
    OrderRouter,
    OrderMigration1669192893118,
    OrderMigration1671165925071,
    OrderMigration1671858926727,
    OrderHistory,
    OrderHistoryRepository,
    OrderHistoryService,
    OrderSearchService,
  ],
})
export class OrderModule {}
