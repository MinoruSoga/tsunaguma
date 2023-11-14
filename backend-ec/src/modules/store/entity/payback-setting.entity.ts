import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { User } from './../../user/entity/user.entity'
import { Store } from './store.entity'

/**
 * @schema BankAccountType
 * title: "BankAccountType"
 * description: "The type of bank account"
 * x-resourceId: BankAccountType
 * type: string
 * enum:
 *   - normal
 *   - deposit
 */

export enum BankAccountType {
  NORMAL = 'normal',
  DEPOSIT = 'deposit',
}

@MedusaEntity()
@Entity()
export class PaybackSetting extends BaseEntity {
  @Column({ nullable: false, type: 'varchar' })
  user_id: string

  @Column({ nullable: false, type: 'varchar' })
  store_id: string

  @Column({ type: 'varchar', nullable: false })
  bank_name: string

  @Column({ type: 'varchar', nullable: false })
  branch_name: string

  @Column({ type: 'varchar', nullable: true })
  bank_code: string

  @Column({ type: 'varchar', nullable: false })
  branch_code: string

  @Column({ type: 'enum', enum: BankAccountType, nullable: false })
  account_type: BankAccountType

  @Column({ type: 'varchar', nullable: false })
  account_name: string

  @Column({ type: 'varchar', nullable: false })
  account_number: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @BeforeInsert()
  private beforeInsert() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'pbs')
    }
  }
}

/**
 * @schema payback_setting
 * title: "PaybackSetting"
 * description: "Represents an account of store to receive money."
 * x-resourceId: payback_setting
 * type: object
 * required:
 *   - id
 *   - account_name
 *   - account_number
 *   - branch_name
 *   - branch_code
 *   - bank_name
 *   - account_type
 * properties:
 *   id:
 *     type: string
 *     description: The payment setting's ID
 *     example: pbs_01G1G5V26F5TB3GPAPNJ8X1S3V
 *   account_name:
 *     type: string
 *   account_number:
 *     type: string
 *   branch_name:
 *     type: string
 *   branch_code:
 *     type: string
 *   bank_name:
 *     type: string
 *   bank_code:
 *     type: string
 *   account_type:
 *     $ref: "#/components/schemas/BankAccountType"
 *   user_id:
 *     type: string
 *   store_id:
 *     type: string
 *   user:
 *     $ref: "#/components/schemas/user"
 *   store:
 *     $ref: "#/components/schemas/store"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
