import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { Withdrawal } from '../entity/withdrawal.entity'

@MedusaRepository()
@EntityRepository(Withdrawal)
export class WithdrawalRepository extends Repository<Withdrawal> {}
