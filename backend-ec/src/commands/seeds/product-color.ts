import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ProductColorRepository } from '../../modules/product/repository/product-color.repository'

export default async function seedColors(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const colorRepo = tx.getCustomRepository(
    container.resolve('productColorRepository'),
  ) as ProductColorRepository

  await Promise.all(
    new Array(100).fill({}).map(() =>
      colorRepo.insert(
        colorRepo.create({
          name: faker.color.human(),
          code: faker.color.rgb(),
        }),
      ),
    ),
  )
}
