import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ProductAddonRepository } from '../../modules/store/repository/product-addon.repository'
import StoreRepository from '../../modules/store/repository/store.repository'

export default async function seedProductAddon(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const addonRepo = tx.getCustomRepository(
    container.resolve('productAddonRepository'),
  ) as ProductAddonRepository
  const storeRepo = tx.getCustomRepository(
    container.resolve('storeRepository'),
  ) as StoreRepository

  const stores = await storeRepo.find()

  const parents = await Promise.all(
    new Array(10).fill({}).map(() =>
      addonRepo.insert(
        addonRepo.create({
          name: faker.color.human(),
          store_id: faker.helpers.arrayElement(stores).id,
        }),
      ),
    ),
  )
  for (const parent of parents) {
    const lv1 = await addonRepo.findOne(parent.identifiers[0].id)
    await Promise.all(
      new Array(10).fill({}).map(() =>
        addonRepo.insert(
          addonRepo.create({
            name: faker.color.human(),
            store_id: lv1.store_id,
            parent_id: lv1.id,
            price: parseInt(faker.finance.amount(10, 2000, 0)),
          }),
        ),
      ),
    )
  }
}
