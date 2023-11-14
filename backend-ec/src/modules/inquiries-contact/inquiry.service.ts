import { TransactionBaseService } from '@medusajs/medusa/dist/interfaces'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import loadConfig, { ExtendedConfig } from '../../helpers/config'
import { contactTypes } from '../../helpers/contactType'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../interfaces/email-template'
import { Attachment } from '../attachment/entity/attachment.entity'
import AttachmentService from '../attachment/services/attachment.service'
import { Inquiry } from './entities/inquiry.entity'
import InquiryRepository from './repositories/inquiry.repository'
import InquiryAttachmentRepository from './repositories/inquiryAttachment.repository'

declare type InquiryServiceProps = {
  inquiryRepository: typeof InquiryRepository
  inquiryAttachmentRepository: typeof InquiryAttachmentRepository
  eventBusService: EventBusService
  manager: EntityManager
  attachmentService: AttachmentService
}

type CreateInQuiryContactInput = {
  first_name: string
  last_name: string
  first_name_kana: string
  last_name_kana: string
  email: string
  phone: string
  type: number
  content: string
  attachments?: Attachment[]
}

@Service()
export class InquiryService
  extends TransactionBaseService
  implements IEmailTemplateDataService
{
  static Events = {
    CREATED: 'inqui.created',
    UPDATED: 'inqui.updated',
    DELETED: 'inqui.deleted',
  }
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected readonly inquiryRepository: typeof InquiryRepository
  protected readonly inquiryAttachmentRepository: typeof InquiryAttachmentRepository
  protected readonly eventBus_: EventBusService
  protected attachmentService_: AttachmentService
  private config: ExtendedConfig
  static resolutionKey = 'inquiryService'

  constructor(private readonly container: InquiryServiceProps) {
    super(container)
    this.inquiryRepository = container.inquiryRepository
    this.inquiryAttachmentRepository = container.inquiryAttachmentRepository
    this.eventBus_ = container.eventBusService
    this.attachmentService_ = container.attachmentService
    this.manager_ = container.manager
    this.config = loadConfig()
  }

  async retrieve(
    selector: Selector<Inquiry>,
    config: FindConfig<Inquiry>,
  ): Promise<Inquiry> {
    const manager = this.manager_
    const inquiryRepository = manager.getCustomRepository(
      this.inquiryRepository,
    )

    const query = buildQuery(selector, config)

    const inquiry = await inquiryRepository.findOne(query)

    return inquiry
  }

  public async create(inquiryContact: CreateInQuiryContactInput) {
    return this.atomicPhase_(async (transactionManager) => {
      const inquiryRepository = transactionManager.getCustomRepository(
        this.inquiryRepository,
      )

      const inquiryAttachmentRepository =
        transactionManager.getCustomRepository(this.inquiryAttachmentRepository)

      // Create Inquiry
      const created = inquiryRepository.create(
        _.omit(inquiryContact, ['attachments']),
      )
      const inquiry = await inquiryRepository.save(created)

      // Create Attachment and InquiryAttachment
      const attachments = inquiryContact.attachments
      if (inquiry && attachments?.length > 0) {
        Promise.all(
          attachments.map(async (attachment) => {
            const attachmentSave = await this.attachmentService_
              .withTransaction(transactionManager)
              .create(attachment)

            await inquiryAttachmentRepository.save(
              inquiryAttachmentRepository.create({
                attachment_id: attachmentSave.id,
                inquiry_id: inquiry.id,
              }),
            )
          }),
        )
      }

      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(InquiryService.Events.CREATED, {
          ..._.omit(inquiry, 'type'),
          inquiry_type: contactTypes.find((ct) => ct.value === inquiry.type)
            .label,
        })
      return inquiry
    })
  }

  async genEmailData(event: string, data: Inquiry): Promise<EmailTemplateData> {
    const inquiry = await this.retrieve(
      { id: data.id },
      { relations: ['attachments'] },
    )

    if (!inquiry) return

    const attachments = this.attachmentService_.convertToEmailAttachments(
      inquiry.attachments,
    )

    return {
      to: [data.email],
      bcc: [this.config.email.email_admin],
      format: 'inquiry-contact',
      data,
      attachments,
    }
  }
}
