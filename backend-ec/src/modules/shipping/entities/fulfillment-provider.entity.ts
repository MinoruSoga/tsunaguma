import { FulfillmentProvider as MedusaFulfillmentProvider } from '@medusajs/medusa/dist'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { Store } from '../../store/entity/store.entity'

@MedusaEntity({ override: MedusaFulfillmentProvider })
@Entity()
export class FulfillmentProvider extends MedusaFulfillmentProvider {
  @Column({ nullable: true })
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true, type: 'bool', default: false })
  is_free: boolean

  @Column({ nullable: true, type: 'bool', default: false })
  is_trackable: boolean

  @Column({ nullable: true, type: 'bool', default: false })
  is_warranty: boolean

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null

  @Column({ nullable: false, default: true, type: 'boolean' })
  is_show: boolean

  @Column({ nullable: false, default: 0, type: 'integer' })
  rank: number

  @BeforeInsert()
  private beforeInsertDefaultVals(): void {
    this.id = generateEntityId(this.id, 'fp')
  }
}

/**
 * @schema fulfillment_provider
 * title: "Fulfillment Provider"
 * description: "Represents a fulfillment provider plugin and holds its installation status."
 * x-resourceId: fulfillment_provider
 * required:
 *    - id
 *    - name
 * properties:
 *   id:
 *     description: "The id of the fulfillment provider as given by the plugin."
 *     type: string
 *     example: manual
 *   is_installed:
 *     description: "Whether the plugin is installed in the current version. Plugins that are no longer installed are not deleted by will have this field set to `false`."
 *     type: boolean
 *     example: true
 *   name:
 *     type: string
 *     description: "Fulfillment provider name."
 *     example: GHTK Transport
 *   is_free:
 *     type: boolean
 *     description: "a option that allow user to choose existed fulfillment providers or they can type their own fulfillment provider name."
 *     example: false
 *   is_trackable:
 *     type: boolean
 *     description: "Fulfillment provider tracking"
 *     example: false
 *   is_warranty:
 *     type: boolean
 *     description: "Fulfillment provider warranty"
 *     example: false
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {sizes: [{id: 1, name: "25g"}]}
 *   store_id:
 *     type: string
 *     description: "The store id which reference to fulfillment provider."
 *     example: store_12345
 *   store:
 *     type: object
 *     description: "The store which reference to fulfillment provider."
 *     $ref: "#/components/schemas/store"
 */
