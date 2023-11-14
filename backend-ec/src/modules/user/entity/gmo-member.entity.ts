import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm'

import { User } from './user.entity'

@MedusaEntity()
@Entity()
export class GmoMember extends BaseEntity {
  @Column({ nullable: false })
  user_id: string

  @Column({ nullable: false })
  member_id: string

  @DeleteDateColumn()
  deleted_at: Date | null

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'gmo_member')
  }
}

/**
 * @schema gmo-member
 * title: "Gmo member"
 * description: "GMO member"
 * x-resourceId: GmoMember
 * properties:
 *   user_id:
 *     type: string
 *     description: "The id of the user"
 *     example: usr_01G53V9Y6CKMCGBM1P0X7C28RX
 *   user:
 *     description: Available if the relation `user` is expanded.
 *     $ref: "#/components/schemas/user"
 *   member_id:
 *     description: "Member id registered on gmo payment."
 *     type: string
 *     example: 5702bf3c-1364-4f9e-8164-f4ef0db38747
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   deleted_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
