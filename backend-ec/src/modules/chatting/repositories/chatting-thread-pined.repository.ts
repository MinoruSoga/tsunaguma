import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ChattingThreadPined } from '../entities/chatting-thread-pined.entity'

@MedusaRepository()
@EntityRepository(ChattingThreadPined)
export class ChattingThreadPinedRepository extends Repository<ChattingThreadPined> {}
