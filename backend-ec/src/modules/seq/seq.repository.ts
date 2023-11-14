import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { SeqMaster } from './seq.entity'

@MedusaRepository()
@EntityRepository(SeqMaster)
export class SeqMasterRepository extends Repository<SeqMaster> {}
