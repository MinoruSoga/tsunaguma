import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { UserWithdrawalReason } from '../entity/user-withdrawal-reason.entity'

@MedusaRepository()
@EntityRepository(UserWithdrawalReason)
export class UserWithdrawalReasonRepository extends Repository<UserWithdrawalReason> {}
