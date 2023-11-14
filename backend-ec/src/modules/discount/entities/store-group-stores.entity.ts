import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

import { Store } from '../../../modules/store/entity/store.entity'
import { StoreGroup } from './store-group.entity'

@MedusaEntity()
@Entity()
export class StoreGroupStores {
  @PrimaryColumn({ type: 'varchar' })
  store_group_id: string

  @PrimaryColumn({ type: 'varchar' })
  store_id: string

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null

  @ManyToOne(() => StoreGroup, (storeGroup) => storeGroup.id)
  @JoinColumn({ name: 'store_group_id', referencedColumnName: 'id' })
  store_group: StoreGroup

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  total_amount?: number
  total_sheet?: number
  total_used?: number
  released_at?: string
}

/**
 * @schema store_group_stores
 * title: "StoreGroupStores"
 * description: "Relations of store group and store"
 * x-resourceId: store_group_stores
 * required:
 *   - store_group_id
 *   - store_id
 * properties:
 *   store_group_id:
 *     type: string
 *     description: Id of store group
 *   store_id:
 *     type: string
 *     description: Id of store
 *   metadata:
 *     type: object
 *     description: metadata of store group stores
 *   store_group:
 *     $ref: "#/components/schemas/store_group"
 *   store:
 *     $ref: "#/components/schemas/store"
 *   total_amount:
 *     type: number
 *   total_sheet:
 *     type: number
 *   total_used:
 *     type: number
 *   released_at:
 *     type: string
 */
