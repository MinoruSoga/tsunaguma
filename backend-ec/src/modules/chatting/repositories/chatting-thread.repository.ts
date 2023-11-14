import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ChattingThread } from '../entities/chatting-thread.entity'

@MedusaRepository()
@EntityRepository(ChattingThread)
export class ChattingThreadRepository extends Repository<ChattingThread> {}
