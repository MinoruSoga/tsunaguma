import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { Prefecture } from '../entity/prefecture.entity'

@MedusaRepository()
@EntityRepository(Prefecture)
export class PrefectureRepository extends Repository<Prefecture> {}
