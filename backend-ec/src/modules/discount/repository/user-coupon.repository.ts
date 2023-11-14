import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { UserCoupon } from '../entities/user-coupon.entity'

@MedusaRepository()
@EntityRepository(UserCoupon)
export class UserCouponRepository extends Repository<UserCoupon> {}
