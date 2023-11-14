import { BaseEntity, User } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { WithdrawalReason } from './withdrawnal-reason.entity'

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
/**
 * @schema WithdrawalStatusEnum
 * title: "WithdrawalStatusEnum"
 * description: "The list of status of the WithdrawalStatus"
 * x-resourceId: WithdrawalStatusEnum
 * type: string
 * enum:
 *   - pending
 *   - approved
 *   - rejected
 */

@MedusaEntity()
@Entity()
export class Withdrawal extends BaseEntity {
  @Column({ nullable: false, type: 'varchar' })
  user_id: string

  @Column({ nullable: true, type: 'varchar' })
  store_id: string

  @Column({ nullable: true, type: 'text' })
  note: string

  @Index()
  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: object

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.APPROVED,
  })
  status: WithdrawalStatus

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @ManyToMany(() => WithdrawalReason, { cascade: ['insert'] })
  @JoinTable({
    name: 'user_withdrawal_reason',
    joinColumn: {
      name: 'withdrawal_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'withdrawal_reason_id',
      referencedColumnName: 'id',
    },
  })
  reasons: WithdrawalReason[]

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'withdrawal')
    }
  }
}

/**
 * @schema withdrawal
 * title: "withdrawal"
 * description: "withdrawal"
 * x-resourceId: withdrawal
 * required:
 *   - id
 *   - user_id
 *   - status
 * properties:
 *  id:
 *    type: string
 *    description: The withdrawal's ID
 *  user_id:
 *    type: string
 *    description: User
 *  store_id:
 *    type: string
 *    description: Store
 *  user:
 *     $ref: "#/components/schemas/user"
 *  store:
 *     $ref: "#/components/schemas/store"
 *  note:
 *    type: string
 *    description: Note
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 *  reasons:
 *     description: Reason to withdraw.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/withdrawal_reason"
 *  created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *  updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *  status:
 *     $ref: "#/components/schemas/WithdrawalStatusEnum"
 */
