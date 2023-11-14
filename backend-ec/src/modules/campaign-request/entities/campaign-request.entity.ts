import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import {
  DbAwareColumn,
  resolveDbGenerationStrategy,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm'

import { Product } from '../../product/entity/product.entity'
import { Store } from '../../store/entity/store.entity'

/**
 * @schema CampaignRequestStatus
 * title: "CampaignRequestStatus"
 * description: "The list of status of the campaign request"
 * x-resourceId: CampaignRequestStatus
 * type: string
 * enum:
 *   - request
 *   - approve
 *   - expired
 *   - deleted
 */

export enum CampaignRequestStatus {
  REQUEST = 'request',
  APPROVE = 'approve',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

/**
 * @schema CampaignRequestType
 * title: "CampaignRequestType"
 * description: "The list of type of the campaign request"
 * x-resourceId: CampaignRequestType
 * type: string
 * enum:
 *   - one_work
 *   - half_off
 */

export enum CampaignRequestType {
  ONE_WORK = 'one_work',
  HALF_OFF = 'half_off',
}

/**
 * @schema campaign_request
 * title: "CampaignRequest"
 * description: "Campaign request."
 * x-resourceId: campaign_request
 * required:
 *   - product_id
 *   - store_id
 *   - status
 *   - type
 * properties:
 *   id:
 *     type: string
 *     example: dev_req_01G749BFYR6T8JTVW6SGW3K3E6
 *   product_id:
 *     description: The Id of product
 *     type: string
 *   product:
 *     description: Available if the relation `product_id` is expanded.
 *     $ref: "#/components/schemas/product"
 *   store_id:
 *     type: string
 *     description: The store id of product
 *     example: str_01G8ZH853YPY9B94857DY91YGW
 *   store:
 *     description: Available if the relation `store_id` is expanded.
 *     $ref: "#/components/schemas/store"
 *   status:
 *     $ref: "#/components/schemas/CampaignRequestStatus"
 *   type:
 *     $ref: "#/components/schemas/CampaignRequestType"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   expired_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   approved_at:
 *     type: string
 *   display_id:
 *     type: string
 *     description: "Auto generated display id"
 *   metadata:
 *     type: object
 *     description: "Metadata of delivery request"
 */

@MedusaEntity()
@Entity()
export class CampaignRequest extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  product_id: string

  @ManyToOne(() => Product, (product) => product.id, { nullable: true })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product

  @Index()
  @Column({ type: 'varchar', nullable: false })
  store_id: string

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({
    type: 'enum',
    enum: CampaignRequestStatus,
    default: CampaignRequestStatus.REQUEST,
  })
  status: CampaignRequestStatus

  @Column({
    type: 'enum',
    enum: CampaignRequestType,
    default: CampaignRequestType.ONE_WORK,
  })
  type: CampaignRequestType

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ nullable: true })
  expired_at: Date

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  approved_at: Date | null

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'camp_req')
    }
  }
}
