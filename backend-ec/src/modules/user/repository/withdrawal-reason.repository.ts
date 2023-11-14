import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { WithdrawalReason } from '../entity/withdrawnal-reason.entity'

@MedusaRepository()
@EntityRepository(WithdrawalReason)
export class WithdrawalReasonRepository extends Repository<WithdrawalReason> {}
