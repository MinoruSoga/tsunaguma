import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm'

import { Attachment } from '../../attachment/entity/attachment.entity'
import { Inquiry } from './inquiry.entity'

@MedusaEntity()
@Entity()
export class InquiryAttachment {
  @PrimaryColumn({ type: 'varchar' })
  inquiry_id: string

  @ManyToOne(() => Inquiry)
  @JoinColumn({ name: 'inquiry_id', referencedColumnName: 'id' })
  inquiry: Inquiry

  @PrimaryColumn({ type: 'varchar' })
  attachment_id: string

  @OneToOne(() => Attachment)
  @JoinColumn({ name: 'attachment_id', referencedColumnName: 'id' })
  attachment: Attachment

  @CreateDateColumn({ type: resolveDbType('timestamptz'), nullable: true })
  created_at: Date

  @CreateDateColumn({ type: resolveDbType('timestamptz'), nullable: true })
  updated_at: Date
}

/**
 * @schema InquiryAttachment
 * title: "InquiryAttachment"
 * description: "Relation of inquiry and attachment"
 * x-resourceId: InquiryAttachment
 * type: object
 * required:
 *   - inquiry_id
 *   - attachment_id
 * properties:
 *   inquiry_id:
 *     type: string
 *     description: "The id of inquiry"
 *     example: "inqui_01G1G5V26F5TB3GPAPNJ8X1S3V"
 *   attachment_id:
 *     type: string
 *     description: "The id of attachment"
 *     example: "attachment_6HFGABNNBHAJNJ787JJJBSS"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
