import { Module } from 'medusa-extender'

import { Inquiry } from './entities/inquiry.entity'
import { InquiryAttachment } from './entities/inquiry-attachment.entity'
import { InquiryRouter } from './inquiry.router'
import { InquiryService } from './inquiry.service'
import { ContactMigration1671182635770 } from './migrations/1671182635770-contact.migration'
import { InquiryAttachmentMigration1679558668229 } from './migrations/1679558668229-inquiryAttachment.migration'
import InquiryRepository from './repositories/inquiry.repository'
import InquiryAttachmentRepository from './repositories/inquiryAttachment.repository'

@Module({
  imports: [
    Inquiry,
    InquiryRepository,
    InquiryService,
    InquiryRouter,
    InquiryAttachmentRepository,
    ContactMigration1671182635770,
    InquiryAttachment,
    InquiryAttachmentMigration1679558668229,
  ],
})
export class InquiryModule {}
