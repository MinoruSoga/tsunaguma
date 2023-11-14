import { User as MedusaUser } from '@medusajs/medusa/dist'
import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import dayjs from 'dayjs'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm'

import { NotificationSettings } from '../../notification/entities/notification-settings.entity'
import { Role } from '../../role/role.entity'
import { Store } from '../../store/entity/store.entity'
import { PaybackSetting } from './../../store/entity/payback-setting.entity'
import { Address } from './address.entity'
import { Customer } from './customer.entity'

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  BANNED = 'banned',
}
/**
 * @schema UserStatusEnum
 * title: "UserStatusEnum"
 * description: "The list of status of the User"
 * x-resourceId: UserStatusEnum
 * type: string
 * enum:
 *   - active
 *   - inactive
 *   - deleted
 *   - banned
 */

export enum UserType {
  ADMIN_ADMIN = 'admin_admin',
  ADMIN_STAFF = 'admin_staff',
  CUSTOMER = 'customer',
  STORE_STANDARD = 'store_standard',
  STORE_PRIME = 'store_prime',
}
/**
 * @schema UserTypeEnum
 * title: "UserTypeEnum"
 * description: "The list of type of the User"
 * x-resourceId: UserTypeEnum
 * type: string
 * enum:
 *   - admin_admin
 *   - admin_staff
 *   - customer
 *   - store_standard
 *   - store_prime
 */

@MedusaEntity({ override: MedusaUser })
@Entity()
export class User extends MedusaUser {
  @Index()
  @Column({ nullable: true })
  store_id: string

  @OneToOne(() => Store)
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Index()
  @Column({ nullable: true })
  role_id: string

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  teamRole: Role

  @Column({ nullable: true })
  nickname: string

  @Column({
    nullable: false,
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus

  @Column({
    nullable: false,
    type: 'enum',
    enum: UserType,
    default: UserType.CUSTOMER,
  })
  type: UserType

  @Column({ nullable: true, type: 'varchar' })
  avatar: string

  @Column({ type: 'varchar', nullable: true })
  payback_setting_id: string

  @OneToOne(() => PaybackSetting)
  @JoinColumn({ name: 'payback_setting_id', referencedColumnName: 'id' })
  payback_setting: PaybackSetting

  @Column({ type: 'varchar', nullable: true })
  address_id: string

  @OneToOne(() => Address)
  @JoinColumn({ name: 'address_id', referencedColumnName: 'id' })
  address: Address

  @Column({ type: 'bool', default: true })
  gb_flg: boolean

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  latest_used_at: Date

  @Column({ nullable: true, type: 'varchar' })
  reset_password_token?: string

  @Column({ default: 0, type: 'integer' })
  new_noti_cnt: number

  @Column({ type: 'varchar', nullable: true })
  cart_id?: string

  point?: object

  notificationSettings?: NotificationSettings

  total_amount?: number

  total_purchases?: number

  total_reviews?: number

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'id', referencedColumnName: 'id' })
  customer: Customer

  @BeforeInsert()
  private beforeInsertDefaultVals(): void {
    if (!this.status) {
      this.status = UserStatus.ACTIVE
    }
    if (!this.type) {
      this.type = UserType.CUSTOMER
    }
  }

  @BeforeUpdate()
  updateMetdata() {
    let update_histories = (this.metadata?.update_histories as any) ?? []
    update_histories.unshift({
      captured_at: dayjs(new Date()).format('HH:mm DD-MM-YYYY'),
      capturedData: {
        nickname: this.nickname,
        email: this.email,
        avatar: this.avatar,
      },
    })

    if (update_histories.length > 50) {
      update_histories = update_histories.slice(0, 50)
    }

    this.metadata = { ...(this.metadata || {}), update_histories }
  }
}

/**
 * @schema user
 * title: "User"
 * description: "Represents a User who can manage store settings."
 * x-resourceId: user
 * type: object
 * required:
 *   - email
 *   - status
 *   - type
 * properties:
 *   id:
 *     type: string
 *     description: The user's ID
 *     example: usr_01G1G5V26F5TB3GPAPNJ8X1S3V
 *   email:
 *     description: "The email of the User"
 *     type: string
 *     format: email
 *   first_name:
 *     description: "The first name of the User"
 *     type: string
 *     example: Levi
 *   last_name:
 *     description: "The last name of the User"
 *     type: string
 *     example: Bogan
 *   api_token:
 *     description: An API token associated with the user.
 *     type: string
 *     example: null
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   deleted_at:
 *     type: string
 *     description: "The date with timezone at which the resource was deleted."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   nickname:
 *     type: string
 *     description: "The nickname of the User"
 *   status:
 *     $ref: "#/components/schemas/UserStatusEnum"
 *   type:
 *     $ref: "#/components/schemas/UserTypeEnum"
 *   avatar:
 *     type: string
 *     description: "The avatar url of user"
 *   store_id:
 *     type: string
 *     description: "The store id"
 *   store:
 *     $ref: "#/components/schemas/store"
 *   payback_setting_id:
 *     type: string
 *   payback_setting:
 *     $ref: "#/components/schemas/payback_setting"
 *   address_id:
 *     type: string
 *     description: "The address id"
 *   address:
 *     $ref: "#/components/schemas/address"
 *   latest_used_at:
 *     type: string
 *     description: "The date with timezone at which the resource was deleted."
 *     format: date-time
 *   gb_flg:
 *     type: boolean
 *   reset_password_token:
 *     type: string
 *   point:
 *     type: object
 *   notificationSettings:
 *     $ref: "#/components/schemas/notification_setting"
 *   jwt:
 *     type: string
 *     description: "login jwt session"
 *   customer:
 *     $ref: "#/components/schemas/customer"
 *   new_noti_cnt:
 *     type: number
 *   cart_id:
 *     type: string
 *     description: The cart's ID
 *     example: cart_01G8ZH853Y6TFXWPG5EYE81X63
 */

/**
 * @schema address_fields
 * title: "Address Fields"
 * description: "Address fields used when creating/updating an address."
 * x-resourceId: address
 * properties:
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
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 *  is_show:
 *    type: boolean
 */
