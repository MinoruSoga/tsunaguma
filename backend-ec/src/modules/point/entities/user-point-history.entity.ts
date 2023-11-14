import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { User } from '../../user/entity/user.entity'

type MetaDataType = {
  message: string
}
/**
 * @schema metaDataType
 * title: "Metadata Type"
 * description: "Metadata type"
 * x-resourceId: MetaDataType
 * properties:
 *   message:
 *     type: string
 */

@MedusaEntity()
@Entity()
export class UserPointHistory extends BaseEntity {
  @Index()
  @Column({ type: 'string', nullable: false })
  user_id: string

  @Column({ type: 'integer', nullable: false })
  amount: number

  @Column({ type: 'integer', default: 0 })
  left_amount: number

  @Column({ nullable: true })
  expired_at: Date

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: MetaDataType

  @Column({ type: 'integer' })
  total: number

  @BeforeInsert()
  private beforeInsert() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'uph_')
    }
  }
}
/**
 * @schema userPointHistory
 * title: "User Point History"
 * description: "List point for user"
 * x-resourceId: userPointHistory
 * required:
 *  - user_id
 *  - left_amount
 *  - amount
 * properties:
 *   id:
 *     description: "The id of the user_point_history"
 *     type: string
 *     example: user_point_history_1
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     example: usr_1
 *   amount:
 *     description: "Total Point"
 *     type: integer
 *     example: 100
 *   expired_at:
 *     type: string
 *     nullable: true
 *   metadata:
 *     $ref: '#/components/schemas/metaDataType'
 *   created_at:
 *     type: string
 *   updated_at:
 *     type: string
 *   total:
 *     description: "Total Point"
 *     type: integer
 *     example: 10
 *   left_amount:
 *     type: number
 *     description: Left amount after has been used
 */
