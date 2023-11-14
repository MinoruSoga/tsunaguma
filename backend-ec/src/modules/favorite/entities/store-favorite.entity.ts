import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import { User } from '../../user/entity/user.entity'

@MedusaEntity()
@Entity()
export class StoreFavorite {
  @PrimaryColumn({ type: 'varchar' })
  user_id: string

  @PrimaryColumn({ type: 'varchar' })
  store_id: string

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn({ name: 'store_id' })
  store: Store

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date
}

/**
 * @schema StoreFavorite
 * title: "Store Favorite"
 * description: "Store Favorite"
 * x-resourceId: StoreFavorite
 * required:
 *   - user_id
 *   - store_id
 * properties:
 *   user_id:
 *     description: "The id of the user"
 *     type: string
 *     example: usr_1
 *   user:
 *     description: Available if the relation `user_id` is expanded.
 *     $ref: "#/components/schemas/user"
 *   store_id:
 *     description: "The id of the store"
 *     type: string
 *     example: store_1
 *   store:
 *     description: Available if the relation `store_id` is expanded.
 *     $ref: "#/components/schemas/store"
 *   created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *   updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
