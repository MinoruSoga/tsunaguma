import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ProductSpecRepository } from '../../modules/product/repository/product-spec.repository'
import ProductTypeRepository from '../../modules/product/repository/product-type.repository'

export default async function seedSpecs(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const typeRepo = tx.getCustomRepository(
    container.resolve('productTypeRepository'),
  ) as ProductTypeRepository
  const specRepo = tx.getCustomRepository(
    container.resolve('productSpecRepository'),
  ) as ProductSpecRepository

  const types = await typeRepo.find()

  await Promise.all(
    new Array(20).fill({}).map(() =>
      specRepo.insert(
        specRepo.create({
          name: faker.animal.cow(),
          product_type_id: faker.helpers.arrayElement(types).id,
        }),
      ),
    ),
  )
}
