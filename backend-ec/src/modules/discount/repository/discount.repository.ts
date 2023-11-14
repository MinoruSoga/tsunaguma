import { DiscountRepository as MedusaDiscountRepository } from '@medusajs/medusa/dist/repositories/discount'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { Discount } from '../entities/discount.entity'

@MedusaRepository({ override: MedusaDiscountRepository })
@EntityRepository(Discount)
export class DiscountRepository extends Utils.repositoryMixin<
  Discount,
  MedusaDiscountRepository
>(MedusaDiscountRepository) {}
