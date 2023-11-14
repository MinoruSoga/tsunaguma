import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { UserDiscount } from '../entities/user-discount.entity'

@MedusaRepository()
@EntityRepository(UserDiscount)
export class UserDiscountRepository extends Repository<UserDiscount> {}
