import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ProductMaterialRepository } from '../../modules/product/repository/product-material.repository'
import ProductTypeRepository from '../../modules/product/repository/product-type.repository'

export default async function seedMaterials(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const typeRepo = tx.getCustomRepository(
    container.resolve('productTypeRepository'),
  ) as ProductTypeRepository
  const materialRepo = tx.getCustomRepository(
    container.resolve('productMaterialRepository'),
  ) as ProductMaterialRepository

  const types = await typeRepo.find()

  await Promise.all(
    new Array(20).fill({}).map(() =>
      materialRepo.insert(
        materialRepo.create({
          name: faker.animal.cow(),
          product_type_id: faker.helpers.arrayElement(types).id,
        }),
      ),
    ),
  )
}
