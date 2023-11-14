import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { Complain } from '../complain.entity'

@MedusaRepository()
@EntityRepository(Complain)
export class ComplainRepository extends Repository<Complain> {}
