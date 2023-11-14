import { Module } from 'medusa-extender'

import { Attachment } from './entity/attachment.entity'
import { AttachmentMigration1679556469795 } from './migrations/1679556469795-attachment.migration'
import { AttachmentRepository } from './repository/attachment.repository'
import AttachmentService from './services/attachment.service'

@Module({
  imports: [
    Attachment,
    AttachmentRepository,
    AttachmentMigration1679556469795,
    AttachmentService,
  ],
})
export class AttachmentModule {}
