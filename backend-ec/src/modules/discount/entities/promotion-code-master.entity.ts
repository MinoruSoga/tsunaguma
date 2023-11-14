import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import {
  DbAwareColumn,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { Store } from '../../store/entity/store.entity'

@MedusaEntity()
@Entity()
@Index('store_promotion_code_master_unique', ['code', 'store_id'], {
  unique: true,
  where: 'store_id IS NOT NULL',
})
@Index('code_master_unique', ['code'], { unique: true })
export class PromotionCodeMaster extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  code: string

  @Column({ type: 'varchar', nullable: true })
  store_id: string

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ type: 'boolean', default: true })
  is_available: boolean

  @Column({
    type: resolveDbType('timestamptz'),
    default: () => 'CURRENT_TIMESTAMP',
  })
  starts_at: Date

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  ends_at: Date | null

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'promo_code_master')
    }
  }
}
