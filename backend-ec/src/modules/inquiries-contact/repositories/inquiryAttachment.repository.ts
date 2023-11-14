import { Repository as MedusaRepository } from 'medusa-extender/dist/decorators/components.decorator'
import { EntityRepository, Repository } from 'typeorm'

import { InquiryAttachment } from '../entities/inquiry-attachment.entity'

@MedusaRepository()
@EntityRepository(InquiryAttachment)
export default class InquiryAttachmentRepository extends Repository<InquiryAttachment> {}
