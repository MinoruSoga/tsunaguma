import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity } from 'typeorm'

@MedusaEntity()
@Entity()
export class Attachment extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  url: string

  @Column({ type: 'varchar', nullable: true })
  file_name: string

  @Column({ type: 'varchar', nullable: true })
  type: string

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @BeforeInsert()
  beforeInsert(): void {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'attachment')
    }
  }
}

/**
 * @schema attachment
 * title: "Attachment"
 * description: "S3 keys of attachment files"
 * x-resourceId: attachment
 * type: object
 * required:
 *   - url
 * properties:
 *   id:
 *     type: string
 *     description: "The id of attachment"
 *     example: "attachment_6HFGABNNBHAJNJ787JJJBSS"
 *   url:
 *     type: string
 *     description: "S3 key of attachment file"
 *     example: public/example.jpg
 *   file_name:
 *     type: string
 *     description: "The name of attachment file"
 *     example: "example.jpg"
 *   type:
 *     type: string
 *     description: "The type of attachment file"
 *     example: "image_jpg"
 *   metadata:
 *     type: object
 *     description: "Metadata of attachment"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 */
