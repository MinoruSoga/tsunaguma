import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { FulfillmentProviderService } from '../../modules/shipping/services/fulfillment-provider.service'

const seedFulfillmentProvivder = async (
  container: MedusaContainer,
  transactionManager: EntityManager,
) => {
  const fulfillmentProviderService: FulfillmentProviderService =
    container.resolve('fulfillmentProviderService')

  // await fulfillmentProviderService.deleteAll()

  await Promise.all(
    Array(8)
      .fill(1)
      .map(async () => {
        await fulfillmentProviderService
          .withTransaction(transactionManager)
          .create({
            name: faker.company.name(),
            is_free: faker.datatype.boolean(),
            is_trackable: faker.datatype.boolean(),
            is_warranty: faker.datatype.boolean(),
            metadata: {
              sizes: Array(5)
                .fill(1)
                .map((_, index) => ({
                  name: `${(index + 1) * 5}kg以内`,
                  id: faker.database.mongodbObjectId(),
                })),
            },
          })
      }),
  )
}

export default seedFulfillmentProvivder
