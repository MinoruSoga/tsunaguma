import { BaseEntity } from '@medusajs/medusa/dist/interfaces/models/base-entity'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import {
  DbAwareColumn,
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { ChattingThread } from './chatting-thread.entity'

export enum MessageTypes {
  STRING = 'string',
  IMAGE = 'image',
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
}

type MetaDataType = {
  message: string
  type: MessageTypes
}

export enum ReadStatus {
  ALL = 'all',
  UN_READ = 'un_read',
  READ = 'read',
  TREATED = 'treated',
  UN_TREATED = 'un_treated',
}

/**
 * @schema messageMetaDataType
 * title: "Message Metadata Type"
 * description: "Metadata type"
 * x-resourceId: MetaDataType
 * properties:
 *   message:
 *     type: string
 *   type:
 *     type: string
 */

@MedusaEntity()
@Entity()
export class ChattingMessage extends BaseEntity {
  @Column()
  chatting_thread_id: string

  @ManyToOne(() => ChattingThread, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'chatting_thread_id', referencedColumnName: 'id' })
  chatting_thread: ChattingThread

  @Column()
  sender_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender: User

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: MetaDataType

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ nullable: true, default: null })
  // @DeleteDateColumn({ type: resolveDbType('timestamptz') })
  deleted_at: Date | null

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'chatting_message')
  }
}

/**
 * @schema chattingMessage
 * title: "Chatting Message"
 * description: "List messages of chatting thread"
 * x-resourceId: chattingMessage
 * properties:
 *   id:
 *     description: "The id of the chatting_message"
 *     type: string
 *     example: chatting_message_1
 *   chatting_thread_id:
 *     description: "The id of the chatting thread"
 *     type: string
 *     example: chatting_thread_1
 *   sender_id:
 *     description: "The id of the user"
 *     type: string
 *     example: usr_1
 *   metadata:
 *     $ref: '#/components/schemas/messageMetaDataType'
 *   created_at:
 *     type: string
 *   updated_at:
 *     type: string
 *   display_id:
 *     type: integer
 *     description: The message's display ID
 *     example: 1
 *   sender:
 *     $ref: "#/components/schemas/user"
 */
