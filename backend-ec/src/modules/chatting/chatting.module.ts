import { Module } from 'medusa-extender'

import { ChattingRouter } from './chatting.router'
import { ChattingService } from './chatting.service'
import { ChattingMessage } from './entities/chatting-message.entity'
import { ChattingThread } from './entities/chatting-thread.entity'
import { ChattingThreadPined } from './entities/chatting-thread-pined.entity'
import { ChattingMigration1667292515221 } from './migrations/1667292515221-chatting.migration'
import { ChattingMigration1667293119365 } from './migrations/1667293119365-chatting.migration'
import { ChattingMigration1667457728773 } from './migrations/1667457728773-chatting.migration'
import { ChattingMigration1670821818903 } from './migrations/1670821818903-chatting.migration'
import { ChattingMigration1670822363896 } from './migrations/1670822363896-chatting.migration'
import { ChattingMigration1671880448897 } from './migrations/1671880448897-chatting.migration'
import { ChattingMigration1698665065994 } from './migrations/1698665065994-chatting.migration'
import { ChattingMessageRepository } from './repositories/chatting-message.repository'
import { ChattingThreadRepository } from './repositories/chatting-thread.repository'
import { ChattingThreadPinedRepository } from './repositories/chatting-thread-pined.repository'

@Module({
  imports: [
    ChattingMigration1667292515221,
    ChattingMigration1667293119365,
    ChattingRouter,
    ChattingService,
    ChattingThread,
    ChattingMessage,
    ChattingThreadRepository,
    ChattingMessageRepository,
    ChattingMigration1667457728773,
    ChattingThreadPined,
    ChattingThreadPinedRepository,
    ChattingMigration1670822363896,
    ChattingMigration1670821818903,
    ChattingMigration1671880448897,
    ChattingMigration1698665065994,
  ],
})
export class ChattingModule {}
