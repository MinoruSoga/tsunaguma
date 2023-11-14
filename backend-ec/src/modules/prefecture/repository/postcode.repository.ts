import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { Postcode } from '../entity/postcode.entity'

@MedusaRepository()
@EntityRepository(Postcode)
export class PostcodeRepository extends Repository<Postcode> {}
