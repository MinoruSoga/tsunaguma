import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity } from 'typeorm'

/**
 * @schema WithdrawalReasonTypeEnum
 * title: "WithdrawalReasonTypeEnum"
 * description: "Standard or premium"
 * x-resourceId: WithdrawalReasonTypeEnum
 * type: string
 * enum:
 *   - standard
 *   - premium
 */
export enum WithdrawalReasonType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

@MedusaEntity()
@Entity()
export class WithdrawalReason extends BaseEntity {
  @Column({ nullable: false, type: 'varchar' })
  value: string

  @Column({
    type: 'enum',
    enum: WithdrawalReasonType,
    default: WithdrawalReasonType.STANDARD,
  })
  reason_type: WithdrawalReasonType

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'withdrawal_reason')
    }
  }
}

/**
 * @schema withdrawal_reason
 * title: "withdrawal_reason"
 * description: "withdrawal_reason"
 * x-resourceId: withdrawal_reason
 * required:
 *   - id
 *   - value
 *   - reason_type
 * properties:
 *  id:
 *    type: string
 *    description: The withdrawal reason's ID
 *  value:
 *    type: string
 *    description: Reason text
 *  created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *  updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *  reason_type:
 *     $ref: "#/components/schemas/WithdrawalReasonTypeEnum"
 */
