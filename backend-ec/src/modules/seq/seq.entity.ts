import { BaseEntity } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity } from 'typeorm'

@MedusaEntity()
@Entity()
export class SeqMaster extends BaseEntity {
  @Column({ nullable: false })
  seq: number
}
