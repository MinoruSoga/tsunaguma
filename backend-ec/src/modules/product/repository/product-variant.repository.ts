import { ProductVariantRepository as MedusaProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { ProductVariant } from '../entity/product-variant.entity'

@MedusaRepository({ override: MedusaProductVariantRepository })
@EntityRepository(ProductVariant)
export class ProductVariantRepository extends Utils.repositoryMixin<
  ProductVariant,
  MedusaProductVariantRepository
>(MedusaProductVariantRepository) {}
