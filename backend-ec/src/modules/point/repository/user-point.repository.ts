import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { UserPoint } from '../entities/user-point.entity'

@MedusaRepository()
@EntityRepository(UserPoint)
export class UserPointRepository extends Repository<UserPoint> {}
