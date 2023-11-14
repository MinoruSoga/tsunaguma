import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Prefecture } from '../../../modules/prefecture/entity/prefecture.entity'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@MedusaEntity()
@Entity()
export class FulfillmentPrice extends BaseEntity {
  @Column({ nullable: true })
  from_pref_id: string

  @ManyToOne(() => Prefecture, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'from_pref_id', referencedColumnName: 'id' })
  from_pref: Prefecture

  @Column({ nullable: true })
  to_pref_id: string

  @ManyToOne(() => Prefecture, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'to_pref_id', referencedColumnName: 'id' })
  to_pref: Prefecture

  @Column()
  provider_id: string

  @Column({ nullable: true })
  size: string

  @Column()
  price: number

  @BeforeInsert()
  private beforeInsertId() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'fulp')
    }
  }
}

/**
 * @schema fulfillment_price
 * title: "Fulfillment price"
 * description: "Represents a fulfillment price plugin and holds its installation status."
 * x-resourceId: fulfillment_price
 * required:
 *    - id
 *    - provider_id
 *    - price
 * properties:
 *   id:
 *     description: "The id of the fulfillment price as given by the plugin."
 *     type: string
 *     example: 'fulp_01229929292333'
 *   from_pref_id:
 *     type: string
 *     description: "Fulfillment price from prefecture id."
 *     example: 'pref_00922929299120'
 *   to_pref_id:
 *     type: string
 *     description: "Fulfillment price to prefecture id."
 *     example: 'pref_00922929299120'
 *   provider_id:
 *     type: string
 *     description: "Id of provider"
 *   size:
 *     type: string
 *     description: "Id of size"
 *   price:
 *     type: number
 *     description: Price of fulfillment
 */
