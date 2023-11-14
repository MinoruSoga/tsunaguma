import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'

import { User } from '../../user/entity/user.entity'

@MedusaEntity()
@Entity()
export class UserPoint {
  @PrimaryColumn({ type: 'varchar' })
  user_id: string

  @Column({ type: 'integer' })
  total: number

  @Column()
  created_at: Date

  @Column()
  updated_at: Date

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User
}
/**
 * @schema userPoint
 * title: "User Point"
 * description: "Total point for user"
 * x-resourceId: userPoint
 * properties:
 *   user_id:
 *     description: "The id of the user_point"
 *     type: string
 *     example: usr_1
 *   total:
 *     description: "Total Point"
 *     type: integer
 *     example: 100
 */
