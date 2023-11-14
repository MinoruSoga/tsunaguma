import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { UserHistory } from '../entity/user-history.entity'

@MedusaRepository()
@EntityRepository(UserHistory)
export class UserHistoryRepository extends Repository<UserHistory> {}
