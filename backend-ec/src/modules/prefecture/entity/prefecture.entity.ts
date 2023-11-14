import { BaseEntity } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'

@MedusaEntity()
@Entity()
export class Prefecture extends BaseEntity {
  @Column()
  name: string

  @Column({ type: 'varchar', nullable: true })
  parent_id: string

  @ManyToOne(() => Prefecture, (pref) => pref.children)
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: Prefecture

  @OneToMany(() => Prefecture, (pref) => pref.parent)
  children: Prefecture[]
}
/**
 * @schema prefecture
 * title: "Prefectures"
 * description: "The list of prefectures in Japan"
 * x-resourceId: prefecture
 * required:
 *   - id
 *   - name
 * properties:
 *   id:
 *     description: "The id of the prefecture"
 *     type: string
 *     example: pref_1
 *   name:
 *     description: "The name of the prefecture"
 *     type: string
 *     example: 京都府
 *   parent_id:
 *     type: string
 *     description: "The parent that the prefecture belongs to."
 *     example: pref_01G8ZH853YPY9B94857DY91YGW
 *   parent:
 *     description: Available if the relation `parent_id` is expanded.
 *     $ref: "#/components/schemas/prefecture"
 *   children:
 *     description: The children of this prefecture. Available if the relation `children` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/prefecture"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 */
