import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import ProductTypeRepository from '../../modules/product/repository/product-type.repository'

export default async function seedProductType(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const typeRepo = tx.getCustomRepository(
    container.resolve('productTypeRepository'),
  ) as ProductTypeRepository

  const lv1s = await Promise.all(
    new Array(20).fill({}).map(() =>
      typeRepo.insert(
        typeRepo.create({
          value: faker.commerce.product(),
        }),
      ),
    ),
  )

  lv1s.forEach(async (lv1) => {
    const lv1Id = lv1.identifiers[0].id
    const lv2s = await Promise.all(
      new Array(10).fill({}).map(() =>
        typeRepo.insert(
          typeRepo.create({
            value: faker.commerce.product(),
            parent_id: lv1Id,
          }),
        ),
      ),
    )

    lv2s.forEach(async (lv2) => {
      const lv2Id = lv2.identifiers[0].id
      await Promise.all(
        new Array(10).fill({}).map(() =>
          typeRepo.insert(
            typeRepo.create({
              value: faker.commerce.product(),
              parent_id: lv2Id,
            }),
          ),
        ),
      )
    })
  })
}
