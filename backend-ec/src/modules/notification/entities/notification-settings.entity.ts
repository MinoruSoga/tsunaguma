import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm'

import { User } from '../../../modules/user/entity/user.entity'

@MedusaEntity()
@Entity()
export class NotificationSettings extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column({ nullable: false, type: 'varchar' })
  user_id: string

  @Column({ nullable: true, type: 'boolean', default: false })
  is_newletter: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_points: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_favorite: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_review: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_newproducts_follow: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_permission_sns: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_coupon: boolean

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @BeforeInsert()
  private beforeInsertId() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'nts')
    }
  }
}

/**
 * @schema notification_setting
 * title: "NotificationSetting"
 * description: "Represents an account of setting notification."
 * x-resourceId: notification_setting
 * type: object
 * required:
 *   - id
 *   - user_id
 * properties:
 *   id:
 *     type: string
 *     description: The notification setting's ID
 *     example: nts_01G1G5V26F5TB3GPAPNJ8X1S3V
 *   user_id:
 *     type: string
 *   is_newletter:
 *     type: boolean
 *   is_points:
 *     type: boolean
 *   is_favorite:
 *     type: boolean
 *   is_review:
 *     type: boolean
 *   is_newproducts_follow:
 *     type: boolean
 *   is_permission_sns:
 *     type: boolean
 *   is_coupon:
 *     type: boolean
 *   user:
 *     $ref: "#/components/schemas/user"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
