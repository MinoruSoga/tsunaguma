import { Address as MedusaAddress } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { JAPANESE_COUNTRY_ISO2 } from '../../../helpers/constant'
import { Prefecture } from '../../prefecture/entity/prefecture.entity'

@MedusaEntity({ override: MedusaAddress })
@Entity()
export class Address extends MedusaAddress {
  @Column({ type: 'bool', default: true })
  is_show: boolean

  @Column({ nullable: false })
  prefecture_id: string

  @ManyToOne(() => Prefecture)
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture: Prefecture

  @BeforeInsert()
  private beforeInsertDefaultVals() {
    if (!this.country_code) {
      this.country_code = JAPANESE_COUNTRY_ISO2
    }

    if (!this.prefecture_id) {
      this.prefecture_id = this.province ?? null
    }
  }
}

/**
 * @schema address
 * title: "Address"
 * description: "An address."
 * x-resourceId: address
 * properties:
 *  id:
 *    type: string
 *    description: ID of the address
 *    example: addr_01G8ZC9VS1XVE149MGH2J7QSSH
 *  customer_id:
 *    type: string
 *    description: ID of the customer this address belongs to
 *    example: cus_01G2SG30J8C85S4A5CHM2S1NS2
 *  customer:
 *    description: Available if the relation `customer` is expanded.
 *    type: array
 *    items:
 *      type: object
 *      description: A customer object.
 *  company:
 *    type: string
 *    description: Company name
 *    example: Acme
 *  first_name:
 *    type: string
 *    description: First name
 *    example: Arno
 *  last_name:
 *    type: string
 *    description: Last name
 *    example: Willms
 *  address_1:
 *    type: string
 *    description: Address line 1
 *    example: 14433 Kemmer Court
 *  address_2:
 *    type: string
 *    description: Address line 2
 *    example: Suite 369
 *  city:
 *    type: string
 *    description: City
 *    example: South Geoffreyview
 *  country_code:
 *    type: string
 *    description: The 2 character ISO code of the country in lower case
 *    externalDocs:
 *      url: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements
 *      description: See a list of codes.
 *    example: st
 *  country:
 *    description: A country object. Available if the relation `country` is expanded.
 *    type: object
 *  province:
 *    type: string
 *    description: Province
 *    example: Kentucky
 *  postal_code:
 *    type: string
 *    description: Postal Code
 *    example: 72093
 *  phone:
 *    type: string
 *    description: Phone Number
 *    example: 16128234334802
 *  created_at:
 *    type: string
 *    description: "The date with timezone at which the resource was created."
 *    format: date-time
 *  updated_at:
 *    type: string
 *    description: "The date with timezone at which the resource was updated."
 *    format: date-time
 *  deleted_at:
 *    type: string
 *    description: "The date with timezone at which the resource was deleted."
 *    format: date-time
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 *  is_show:
 *    type: boolean
 *  prefecture_id:
 *    type: string
 *    description: ID of the prefecture this store belongs to
 *    example: pref_1
 *  prefecture:
 *    description: Available if the relation `prefecture` is expanded.
 *    $ref: "#/components/schemas/prefecture"
 */
