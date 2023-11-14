import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { Attachment } from '../entity/attachment.entity'

@MedusaRepository()
@EntityRepository(Attachment)
export class AttachmentRepository extends Repository<Attachment> {}
