import { BaseEntity } from '@medusajs/medusa/dist/interfaces/models/base-entity'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinTable, ManyToMany } from 'typeorm'

import { Attachment } from '../../attachment/entity/attachment.entity'

/**
 * @schema ContactTypeEnum
 * title: "ContactTypeEnum"
 * description: "The type of inquiry contact"
 * x-resourceId: ContactTypeEnum
 * type: string
 * enum:
 *   - contact
 */

@MedusaEntity()
@Entity()
export class Inquiry extends BaseEntity {
  @Column({ nullable: false })
  first_name: string

  @Column({ nullable: false })
  last_name: string

  @Column({ nullable: false })
  first_name_kana: string

  @Column({ nullable: false })
  last_name_kana: string

  @Column({ nullable: false })
  email: string

  @Column({ nullable: false })
  phone: string

  @Column({
    nullable: false,
    type: 'smallint',
    default: 0,
  })
  type: number

  @Column({ nullable: true })
  content: string

  @ManyToMany(() => Attachment, { cascade: ['insert'] })
  @JoinTable({
    name: 'inquiry_attachment',
    joinColumn: {
      name: 'inquiry_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'attachment_id',
      referencedColumnName: 'id',
    },
  })
  attachments: Attachment[]

  @BeforeInsert()
  private beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'inqui')
    }
  }
}

/**
 * @schema Inquiry
 * title: "Inquiry"
 * description: "Represents information question for system"
 * x-resourceId: Inquiry
 * type: object
 * required:
 *   - first_name
 *   - last_name
 *   - first_name_kana
 *   - last_name_kana
 *   - email
 *   - phone
 * properties:
 *   id:
 *     type: string
 *     description: "The inquiryContact's ID"
 *     example: inqui_01G1G5V26F5TB3GPAPNJ8X1S3V
 *   first_name:
 *     description: "The first name of the User"
 *     type: string
 *     example: first name
 *   last_name:
 *     description: "Lastname of the User"
 *     type: string
 *     example: last name
 *   first_name_kana:
 *     description: "First name in kana"
 *     type: string
 *     example: first name kana
 *   last_name_kana:
 *     description: "Last name in kana"
 *     type: string
 *     example: Last name kana
 *   email:
 *     description: "The email of the User"
 *     type: string
 *     format: email
 *   content:
 *     description: "Contact content information"
 *     type: string
 *     example: i have question..
 *   type:
 *     type: number
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   attachments:
 *     description: Attachments belong to the inquiry.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/attachment"
 */
