import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { UserPointHistory } from '../entities/user-point-history.entity'

@MedusaRepository()
@EntityRepository(UserPointHistory)
export class UserPointHistoryRepository extends Repository<UserPointHistory> {}
