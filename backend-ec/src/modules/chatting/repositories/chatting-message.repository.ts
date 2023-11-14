import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ChattingMessage } from '../entities/chatting-message.entity'

@MedusaRepository()
@EntityRepository(ChattingMessage)
export class ChattingMessageRepository extends Repository<ChattingMessage> {}
