import { BaseEntity } from '@medusajs/medusa/dist/interfaces/models/base-entity'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from '../../user/entity/user.entity'
import { ChattingThread } from './chatting-thread.entity'

@MedusaEntity()
@Entity()
export class ChattingThreadPined extends BaseEntity {
  @Column()
  chatting_thread_id: string

  @ManyToOne(() => ChattingThread, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'chatting_thread_id', referencedColumnName: 'id' })
  chatting_thread: ChattingThread

  @Column()
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @Column()
  value: number

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'thread_pined')
  }
}

/**
 * @schema chattingThreadPined
 * title: "Chatting Thread Pined"
 * description: "Chatting Thread Pined"
 * x-resourceId: chattingThreadPined
 * properties:
 *   id:
 *     description: "The id of the chatting_thread_pined"
 *     type: string
 *     example: chatting_thread_pined_1
 *   chatting_thread_id:
 *     description: "The id of the chatting thread"
 *     type: string
 *     example: chatting_thread_1
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     example: usr_1
 *   value:
 *     description: "This field just using order"
 *     type: integer
 *     example: 1
 *   metadata:
 *     $ref: '#/components/schemas/metaDataType'
 *   created_at:
 *     type: string
 *   updated_at:
 *     type: string
 */
