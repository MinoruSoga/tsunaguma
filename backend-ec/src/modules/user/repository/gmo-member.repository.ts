import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { GmoMember } from '../entity/gmo-member.entity'

@MedusaRepository()
@EntityRepository(GmoMember)
export class GmoMemberRepository extends Repository<GmoMember> {}
