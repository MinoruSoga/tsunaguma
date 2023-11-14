import { TransactionBaseService } from '@medusajs/medusa'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'
import { v4 as uuid } from 'uuid'

import type { AttachmentMail } from '../../../interfaces/email-template'
import { CreateAttachmentInput } from '..'
import { Attachment } from '../entity/attachment.entity'
import { AttachmentRepository } from '../repository/attachment.repository'

type ConstructorParams = {
  manager: EntityManager
  attachmentRepository: typeof AttachmentRepository
}

@Service()
export default class AttachmentService extends TransactionBaseService {
  protected transactionManager_: EntityManager
  protected readonly manager_: EntityManager
  protected readonly container_: EntityManager
  static resolutionKey = 'attachmentService'

  protected readonly attachmentRepository_: typeof AttachmentRepository

  constructor(container: ConstructorParams) {
    super(container)
    this.manager_ = container.manager
    this.attachmentRepository_ = container.attachmentRepository
  }

  async create(attachment: CreateAttachmentInput): Promise<Attachment> {
    return this.atomicPhase_(async (tx) => {
      const attachmentRepo = tx.getCustomRepository(this.attachmentRepository_)
      const attachmentCreate = attachmentRepo.create(attachment)
      const attachmentSave = await attachmentRepo.save(attachmentCreate)
      return attachmentSave
    })
  }

  convertToEmailAttachments(attachments: Attachment[]): AttachmentMail[] {
    return attachments.map((a) => {
      let fileName = a.file_name

      if (!fileName) {
        fileName = `${uuid()}_${new Date().getTime()}`
      }
      return {
        fileName,
        s3Key: a.url,
      }
    })
  }
}
