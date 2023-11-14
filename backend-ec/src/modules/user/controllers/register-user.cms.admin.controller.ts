import {
  StorePostCustomersCustomerAddressesReq,
  UserRoles,
} from '@medusajs/medusa'
import { AddressCreatePayload } from '@medusajs/medusa/dist/types/common'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest, Validator } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import {
  JAPANESE_COUNTRY_ISO2,
  LOGGED_IN_USER_KEY,
} from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { NotificationSettingService } from '../../notification/services/notification-setting.service'
import { Gender, StoreDetail } from '../../store/entity/store-detail.entity'
import { StoreDetailService } from '../../store/services/store-detail.service'
import { isAdmin } from '../constant'
import { Address } from '../entity/address.entity'
import { User, UserStatus, UserType } from '../entity/user.entity'
import CustomerService from '../services/customer.service'
import UserService from '../services/user.service'

export interface CreateUserInput {
  id?: string
  email: string
  first_name?: string
  last_name?: string
  api_token?: string
  role?: UserRoles
  metadata?: Record<string, unknown>
  nickname?: string
  type?: UserType
  status?: UserStatus
  gb_flg?: boolean
}

@Validator({ override: AddressCreatePayload })
export class ExtendedAddressCreatePayload extends AddressCreatePayload {
  @IsOptional()
  @IsBoolean()
  is_show?: boolean

  @IsString()
  prefecture_id?: string
}

@Validator({ override: StorePostCustomersCustomerAddressesReq })
export class ExtendedStorePostCustomersCustomerAddressesReq {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ExtendedAddressCreatePayload)
  address: ExtendedAddressCreatePayload
}

/**
 * @oas [post] /user/register-cms
 * operationId: "CreateUserAdminCms"
 * summary: "Register Account"
 * description: "Register for a User for admin cms."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCmsUserRegisterReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          required:
 *            - user
 *          properties:
 *            user:
 *              $ref: "#/components/schemas/user"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const validated = await validator(AdminCmsUserRegisterReq, req.body)

  const userService: UserService = req.scope.resolve('userService')

  const customerService: CustomerService = req.scope.resolve('customerService')

  const notificationService = req.scope.resolve(
    'notificationSettingService',
  ) as NotificationSettingService

  const storeDetailService: StoreDetailService =
    req.scope.resolve('storeDetailService')

  const strEmail = validated.email

  const data = { ..._.omit(validated, ['password']), strEmail }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, nickname, type, status, is_newletter, ...rest } = data

  const userCreate: CreateUserInput = {
    email: email,
    nickname: nickname,
    type: type,
    status: status,
    first_name: validated.first_name,
    last_name: validated.last_name,
    metadata: validated.metadata,
    gb_flg: validated.gb_flg,
  }

  let user = await userService.retrieveByEmailCms(email)
  if (user) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `${email} already exists account ${user.id}`,
    )
  }

  // Should call a email service provider that sends the token to the user
  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    const user = (await userService
      .withTransaction(transactionManager)
      .create(userCreate, validated.password)) as User

    await customerService
      .withTransaction(transactionManager)
      .createUserCustomer({ ...user, phone: validated.phone })

    const address: DeepPartial<Address> = await customerService
      .withTransaction(transactionManager)
      .addAddress(user.id, {
        country_code: JAPANESE_COUNTRY_ISO2,
        ...rest,
      })

    const storeDetail: DeepPartial<StoreDetail> = {
      prefecture_id: validated.prefecture_id,
      firstname: validated.first_name,
      lastname: validated.last_name,
      firstname_kana: validated.firstname_kana,
      lastname_kana: validated.lastname_kana,
      tel_number: validated.phone,
      addr_01: validated.address_1,
      addr_02: validated.address_2,
      gender: validated.gender,
      birthday: validated.birthday,
      user_id: user.id,
    }

    await storeDetailService
      .withTransaction(transactionManager)
      .create(storeDetail)

    await notificationService
      .withTransaction(transactionManager)
      .update_(user.id, { is_newletter: is_newletter })

    await userService.withTransaction(transactionManager).update_(user.id, {
      address_id: address.id,
    })
  })
  user = await userService.retrieveByEmailCms(email)
  res.status(201).json({ user })
}

/**
 * @schema AdminCmsUserRegisterReq
 * title: "AdminCmsUserRegisterReq"
 * description: "Admin CMS register user req"
 * x-resourceId: AdminCmsUserRegisterReq
 * type: object
 * required:
 *   - nickname
 *   - password
 *   - email
 *   - prefecture_id
 * properties:
 *  password:
 *    type: string
 *    description: password of user
 *    example: 12345678
 *    minLength: 8
 *    maxLength: 50
 *  nickname:
 *    type: string
 *  type:
 *    $ref: "#/components/schemas/UserTypeEnum"
 *  status:
 *    $ref: "#/components/schemas/UserStatusEnum"
 *  email:
 *    type: string
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
 *  prefecture_id:
 *    type: string
 *  gb_flg:
 *    type: boolean
 *  is_newletter:
 *    type: boolean
 *  firstname_kana:
 *    type: string
 *    description: "Furigana first nanme of the seller"
 *  lastname_kana:
 *    type: string
 *    description: "Furigana last nanme of the seller"
 *  gender:
 *    $ref: "#/components/schemas/GenderEnum"
 *  birthday:
 *    type: string
 *    format: date
 *    description: "Date of birth of the seller"
 */

export class AdminCmsUserRegisterReq {
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string

  @IsString()
  nickname: string

  @IsEnum(UserType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      UserType,
    ).join(', ')})`,
  })
  @IsOptional()
  type: UserType

  @IsEnum(UserStatus, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      UserStatus,
    ).join(', ')})`,
  })
  @IsOptional()
  status: UserStatus

  @IsEmail()
  email: string

  @IsString()
  @IsOptional()
  prefecture_id?: string

  @IsString()
  first_name: string

  @IsString()
  last_name: string

  @IsOptional()
  @IsString()
  phone: string

  @IsOptional()
  metadata: Record<string, unknown>

  @IsOptional()
  @IsString()
  company: string

  @IsString()
  address_1: string

  @IsOptional()
  @IsString()
  address_2: string

  @IsString()
  @IsOptional()
  city: string

  @IsOptional()
  @IsString()
  province: string

  @IsString()
  postal_code: string

  @IsBoolean()
  @IsOptional()
  gb_flg: boolean

  @IsBoolean()
  @IsOptional()
  is_newletter: boolean

  //store detail
  @IsOptional()
  @IsEnum(Gender, {
    always: true,
    message: `Invalid value (gender must be one of following values: [${Object.values(
      Gender,
    ).join(',')}])`,
  })
  gender?: Gender

  @IsOptional()
  @IsString()
  birthday?: string

  @IsString()
  @IsOptional()
  firstname_kana?: string

  @IsString()
  @IsOptional()
  lastname_kana?: string
}
