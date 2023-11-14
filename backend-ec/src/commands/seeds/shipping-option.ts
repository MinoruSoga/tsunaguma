import { faker } from '@faker-js/faker'
import { RegionRepository } from '@medusajs/medusa/dist/repositories/region'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { FulfillmentProviderRepository } from '../../modules/shipping/repositories/fulfillment-provider.repository'
import { ShippingOptionRepository } from '../../modules/shipping/repositories/shipping-option.repository'
import { ShippingProfileRepository } from '../../modules/shipping/repositories/shipping-profile.repository'
import StoreRepository from '../../modules/store/repository/store.repository'

export default async function seedShippingOption(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const shippingOptionRepository = tx.getCustomRepository(
    container.resolve('shippingOptionRepository'),
  ) as ShippingOptionRepository
  const shippingProfileRepository = tx.getCustomRepository(
    container.resolve('shippingProfileRepository'),
  ) as ShippingProfileRepository
  const fulfillmentProviderRepository = tx.getCustomRepository(
    container.resolve('fulfillmentProviderRepository'),
  ) as FulfillmentProviderRepository
  const storeRepository = tx.getCustomRepository(
    container.resolve('storeRepository'),
  ) as StoreRepository
  const regionRepository = tx.getCustomRepository(
    container.resolve('regionRepository'),
  ) as RegionRepository

  const profiles = await shippingProfileRepository.find()
  const providers = await fulfillmentProviderRepository.find()
  const stores = await storeRepository.find()
  const region = await regionRepository.findOne()

  await Promise.all(
    new Array(10).fill({}).map(() =>
      shippingOptionRepository.insert(
        shippingOptionRepository.create({
          region_id: region.id,
          name: faker.commerce.product(),
          profile_id: faker.helpers.arrayElement(profiles).id,
          provider_id: faker.helpers.arrayElement(providers).id,
          store_id: faker.helpers.arrayElement(stores).id,
          data: {
            all: 100,
          },
        }),
      ),
    ),
  )
}
