import { BaseEntity, User } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@MedusaEntity()
@Entity()
export class SearchHistory extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  content: string

  @Column({ type: 'varchar', nullable: true })
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @Column({ type: 'varchar', nullable: true })
  tmp_user_id: string

  @BeforeInsert()
  private beforeInsert() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'seh_')
    }
  }
}

/**
 * @schema search_history
 * title: "Search History"
 * description: "Search history of user"
 * x-resourceId: search_history
 * required:
 *   - content
 *   - id
 * properties:
 *  id:
 *     type: string
 *  user_id:
 *     description: "The id of the user_point"
 *     type: string
 *     example: usr_1
 *  user:
 *    description: Available if the relation `user_id` is expanded.
 *    $ref: "#/components/schemas/user"
 *  tmp_user_id:
 *    type: string
 *  content:
 *    type: string
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
