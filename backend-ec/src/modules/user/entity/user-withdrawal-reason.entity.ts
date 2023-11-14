import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { Withdrawal } from './withdrawal.entity'
import { WithdrawalReason } from './withdrawnal-reason.entity'

@MedusaEntity()
@Entity()
export class UserWithdrawalReason extends BaseEntity {
  @Column({ nullable: false, type: 'varchar' })
  withdrawal_id: string

  @Column({ nullable: false, type: 'varchar' })
  withdrawal_reason_id: string

  @ManyToOne(() => Withdrawal)
  @JoinColumn({ name: 'withdrawal_id', referencedColumnName: 'id' })
  withdrawal: Withdrawal

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'withdrawal_reason_id', referencedColumnName: 'id' })
  withdrawal_reason: WithdrawalReason

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'usr_withdrawal_reason')
    }
  }
}
