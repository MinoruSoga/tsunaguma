import { BaseEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity } from 'typeorm'

@MedusaEntity()
@Entity()
export class ProductColor extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false, unique: true })
  code: string

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'prod_color')
  }
}

/**
 * @schema product_color
 * title: "Color"
 * description: "A color."
 * x-resourceId: product_color
 * required:
 *  - name
 *  - code
 * properties:
 *  id:
 *    type: string
 *    description: ID of the color
 *    example: color_01G8ZC9VS1XVE149MGH2J7QSSH
 *  name:
 *    type: string
 *    description: Color name
 *    example: Blue
 *  code:
 *    type: string
 *    description: Color code
 *    example: #ffffff
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 */
