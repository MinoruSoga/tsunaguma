import { SoftDeletableEntity } from '@medusajs/medusa'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'

import { Prefecture } from '../../prefecture/entity/prefecture.entity'
import { User } from '../../user/entity/user.entity'
import { StoreBusinessForm } from './store.entity'

/**
 * @schema GenderEnum
 * title: "GenderEnum"
 * description: "List of user gender"
 * x-resourceId: GenderEnum
 * type: string
 * enum:
 *   - male
 *   - female
 *   - none
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NONE = 'none',
}

/**
 * @schema StorePaymentMethod
 * title: "StorePaymentMethod"
 * description: "The payment method of store"
 * x-resourceId: StorePaymentMethod
 * type: string
 * enum:
 *   - auto_pay
 *   - register
 *   - setting_later
 */
export enum StorePaymentMethod {
  AUTO = 'auto_pay',
  REGISTER = 'register',
  SETTING_LATER = 'setting_later',
}

@MedusaEntity()
@Entity()
export class StoreDetail extends SoftDeletableEntity {
  @PrimaryColumn()
  id: string

  // common between individual and corporation
  @Column({ nullable: false })
  prefecture_id: string

  @ManyToOne(() => Prefecture)
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture: Prefecture

  @Column()
  post_code: string

  // City, street
  @Column({ nullable: true })
  addr_01: string

  // Building name
  @Column({ nullable: true })
  addr_02: string

  // phone number
  @Column({ nullable: true })
  tel_number: string

  // Gender (gender of representative of company incase corporation registration)
  @Column({ type: 'enum', enum: Gender, nullable: false })
  gender: Gender

  // Date of birth (birthday of representative of company incase corporation registration)
  @Column({ type: 'date' })
  birthday: string

  @Column({
    type: 'enum',
    default: StorePaymentMethod.AUTO,
    enum: StorePaymentMethod,
  })
  payment_method: StorePaymentMethod

  // only for cho store individual
  @Column({ nullable: true })
  firstname: string

  @Column({ nullable: true })
  lastname: string

  @Column({ nullable: true })
  firstname_kana: string

  @Column({ nullable: true })
  lastname_kana: string

  @Column({ nullable: true })
  mobile_number: string

  @Column({ nullable: true })
  emerge_number: string

  // only for store corporation
  @Column({ nullable: true })
  company_name: string

  @Column({ nullable: true })
  company_name_kana: string

  @Column({ nullable: true })
  url: string

  @Column({ nullable: true })
  contact_firstname: string

  @Column({ nullable: true })
  contact_lastname: string

  @Column({ nullable: true })
  contact_firstname_kana: string

  @Column({ nullable: true })
  contact_lastname_kana: string

  @Column({ nullable: true })
  contact_tel: string

  @Column({ nullable: true, type: 'bool' })
  compliance_1: boolean

  @Column({ nullable: true, type: 'bool' })
  compliance_2: boolean

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @Column({ type: 'varchar', nullable: true })
  company_official_name: string

  @Column({ type: 'varchar', nullable: true })
  registration_number: string

  @Column({ type: 'varchar', nullable: true })
  referral_code: string

  @Column({ type: 'varchar', nullable: true })
  user_id: string | null

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User | null

  business_form: StoreBusinessForm

  @BeforeInsert()
  private beforeInsertDefaultVals() {
    if (!this.id) {
      this.id = generateEntityId(this.id, 'store')
    }
    if (!this.gender) this.gender = Gender.FEMALE
  }
}

/**
 * @schema store_detail
 * title: "Store Detail Information"
 * description: "Represents an store's detail information"
 * x-resourceId: store_detail
 * properties:
 *  id:
 *    type: string
 *    description: ID of the address
 *    example: addr_01G8ZC9VS1XVE149MGH2J7QSSH
 *  prefecture_id:
 *    type: string
 *    description: ID of the prefecture this store belongs to
 *    example: pref_1
 *  prefecture:
 *    description: Available if the relation `prefecture` is expanded.
 *    $ref: "#/components/schemas/prefecture"
 *  post_code:
 *    type: string
 *    description: Postal Code
 *    example: 123455
 *  addr_01:
 *    type: string
 *    description: City, street name
 *    example: Tokyo
 *  addr_02:
 *    type: string
 *    description: Building name
 *    example: 3D Center
 *  tel_number:
 *    type: string
 *    description: Phone number of store
 *    example: 0294949246
 *  gender:
 *    $ref: "#/components/schemas/GenderEnum"
 *  birthday:
 *    type: string
 *    format: date
 *    description: Birthday of seller (corp representative) (YYYY-MM-DD format)
 *    example: 2022-10-2
 *  payment_method:
 *    $ref: "#/components/schemas/StorePaymentMethod"
 *  firstname:
 *    type: string
 *    description: Kanji first name of seller
 *    example: 名
 *  lastname:
 *    type: string
 *    description: Kanji last name of seller
 *    example: 姓
 *  firstname_kana:
 *    type: string
 *    description: Furigana first name of seller
 *    example: めい
 *  lastname_kana:
 *    type: string
 *    description: Furigana last name of seller
 *    example: せい
 *  mobile_number:
 *    type: string
 *    description: Mobile phone number of seller
 *    example: 014294952
 *  emerge_number:
 *    type: string
 *    description: Emergency phone number of seller
 *    example: 03949593
 *  company_name:
 *    type: string
 *    description: Corporation kanji name
 *    example: つくるをつなぐ株式会社
 *  company_name_kana:
 *    type: string
 *    description: Corporation furigana name
 *    example: つくるをつなぐかぶしきがいしゃ
 *  url:
 *    type: string
 *    description: Website url of corporation
 *    example: https://example.com
 *  contact_firstname:
 *    type: string
 *    description: Kanji first name of corp curator
 *    example: 名
 *  contact_lastname:
 *    type: string
 *    description: Kanji last name of corp curator
 *    example: 姓
 *  contact_firstname_kana:
 *    type: string
 *    description: Furigana first name of corp curator
 *    example: めい
 *  contact_lastname_kana:
 *    type: string
 *    description: Furigana last name of corp curator
 *    example: せい
 *  contact_tel:
 *    type: string
 *    description: Phone number of corp curator
 *    example: 019298382
 *  compliance_1:
 *    type: boolean
 *    description: Compliance 1
 *    example: true
 *  compliance_2:
 *    type: boolean
 *    description: Compliance 2
 *    example: false
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
 *  company_official_name:
 *    type: string
 *  registration_number:
 *    type: string
 *  referral_code:
 *    type: string
 *  user_id:
 *    type: string
 *  user:
 *    $ref: "#/components/schemas/user"
 *  business_form:
 *    $ref: "#/components/schemas/StoreBusinessFormEnum"
 */
