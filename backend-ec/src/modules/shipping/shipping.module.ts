import { Module } from 'medusa-extender'

import { FulfillmentPrice } from './entities/fulfillment-price.entity'
import { FulfillmentProvider } from './entities/fulfillment-provider.entity'
import { ShippingOption } from './entities/shipping-option.entity'
import { ShippingProfile } from './entities/shipping-profile.entity'
import { ShippingMigration1667149597078 } from './migrations/1667149597078-shipping.migration'
import { ShippingMigration1669776986302 } from './migrations/1669776986302-shipping.migration'
import { ShippingMigration1669782224924 } from './migrations/1669782224924-shipping.migration'
import { ShippingMigration1672970507111 } from './migrations/1672970507111-shipping.migration'
import { ShippingMigration1679985989447 } from './migrations/1679985989447-shipping.migration'
import { ShippingMigration1680507769581 } from './migrations/1680507769581-shipping.migration'
import { FulfillmentPriceRepository } from './repositories/fulfillment-price.repository'
import { FulfillmentProviderRepository } from './repositories/fulfillment-provider.repository'
import { ShippingOptionRepository } from './repositories/shipping-option.repository'
import { ShippingProfileRepository } from './repositories/shipping-profile.repository'
import { FulfillmentPriceService } from './services/fulfillment-price.service'
import { FulfillmentProviderService } from './services/fulfillment-provider.service'
import { ShippingOptionService } from './services/shipping-option.service'
import { ShippingProfileService } from './services/shipping-profile.service'
import { ShippingRouter } from './shipping.router'
import { ShippingOptionSubscriber } from './subscribers/shipping-option.subscriber'

@Module({
  imports: [
    FulfillmentProvider,
    FulfillmentPrice,
    ShippingOption,
    ShippingMigration1667149597078,
    ShippingProfile,
    ShippingProfileService,
    FulfillmentPriceService,
    FulfillmentPriceRepository,
    ShippingProfileRepository,
    FulfillmentProviderRepository,
    FulfillmentProviderService,
    ShippingOptionService,
    ShippingOptionRepository,
    ShippingRouter,
    ShippingMigration1669776986302,
    ShippingMigration1669782224924,
    ShippingMigration1672970507111,
    ShippingOptionSubscriber,
    ShippingMigration1679985989447,
    ShippingMigration1680507769581,
  ],
})
export class ShippingModule {}
