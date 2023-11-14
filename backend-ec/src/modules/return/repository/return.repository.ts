import { ReturnRepository as MedusaReturnRepository } from '@medusajs/medusa/dist/repositories/return'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { Return } from '../entities/return.entity'

@MedusaRepository({ override: MedusaReturnRepository })
@EntityRepository(Return)
export class ReturnRepository extends Utils.repositoryMixin<
  Return,
  MedusaReturnRepository
>(MedusaReturnRepository) {}
