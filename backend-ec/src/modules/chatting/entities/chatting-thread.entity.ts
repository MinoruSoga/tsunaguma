import { BaseEntity } from '@medusajs/medusa/dist/interfaces/models/base-entity'
import {
  DbAwareColumn,
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { MedusaError } from 'medusa-core-utils'
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
  OneToOne,
} from 'typeorm'
import * as util from 'util'

import { Store } from '../../store/entity/store.entity'
import { User } from '../../user/entity/user.entity'
import { ChattingMessage } from './chatting-message.entity'
import { ChattingThreadPined } from './chatting-thread-pined.entity'

@MedusaEntity()
@Entity()
export class ChattingThread extends BaseEntity {
  @Column()
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @Column()
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ nullable: true, default: null })
  last_message: string

  @Column({ nullable: true, default: null })
  last_message_by: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'last_message_by', referencedColumnName: 'id' })
  author: User

  @Column({ nullable: true, default: null })
  last_message_at: Date

  @Column({ nullable: false, default: false })
  user_read: boolean

  @Column({ nullable: false, default: false })
  store_read: boolean

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @OneToOne(() => ChattingThreadPined)
  @JoinColumn({ name: 'id', referencedColumnName: 'chatting_thread_id' })
  chatting_thread_pined: ChattingThreadPined

  @OneToOne(() => ChattingMessage)
  @JoinColumn({ name: 'id', referencedColumnName: 'chatting_thread_id' })
  chatting_message: ChattingMessage

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ nullable: true, default: null })
  // @DeleteDateColumn({ type: resolveDbType('timestamptz') })
  deleted_at: Date | null

  count?: number

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateThreadId(this.user_id, this.store_id)
  }
}

export function generateThreadId(userId: string, storeId: string): string {
  return util.format('%s-%s', userId, storeId)
}

export function detectThreadId(threadId: string): ThreadIdDetected {
  try {
    const detectedString = threadId.split('-')

    return {
      userId: detectedString[0],
      storeId: detectedString[1],
    }
  } catch (e) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Chatting thread id wrong format!',
    )
  }
}

export type ThreadIdDetected = {
  userId: string
  storeId: string
}

/**
 * @schema chattingThread
 * title: "Chatting Thread"
 * description: "List chatting thread"
 * x-resourceId: chattingThread
 * properties:
 *   id:
 *     description: "The id of the chatting_thread"
 *     type: string
 *     example: chatting_thread_1
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     example: chatting_thread_1
 *   store_id:
 *     description: "The id of the store"
 *     type: string
 *     example: str_1
 *   last_message:
 *     description: "Last message of the thread"
 *     type: string
 *     example: test
 *   last_message_at:
 *     type: string
 *   store_read:
 *     type: boolean
 *   user_read:
 *     type: boolean
 *   user:
 *     $ref: "#/components/schemas/user"
 *   store:
 *     $ref: "#/components/schemas/store"
 *   chatting_thread_pined:
 *     $ref: "#/components/schemas/chattingThreadPined"
 *   metadata:
 *     type: object
 *   created_at:
 *     type: string
 *   updated_at:
 *     type: string
 *   display_id:
 *     type: integer
 *     description: The thread's display ID
 *     example: 1
 *   count:
 *     type: integer
 *     description: The number message of thread
 *   last_message_by:
 *     type: string
 *   author:
 *     $ref: "#/components/schemas/user"
 */
