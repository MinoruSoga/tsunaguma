import { ProductTypeRepository as MedusaProductTypeRepository } from '@medusajs/medusa/dist/repositories/product-type'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { ProductType } from '../entity/product-type.entity'

@MedusaRepository({ override: MedusaProductTypeRepository })
@EntityRepository(ProductType)
export default class ProductTypeRepository extends Utils.repositoryMixin<
  ProductType,
  MedusaProductTypeRepository
>(MedusaProductTypeRepository) {}
