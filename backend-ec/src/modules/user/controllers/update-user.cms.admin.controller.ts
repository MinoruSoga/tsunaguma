/* eslint-disable @typescript-eslint/no-unused-vars */
import { StorePostCustomersCustomerAddressesAddressReq } from '@medusajs/medusa'
import { AdminUpdateUserRequest } from '@medusajs/medusa/dist/api/routes/admin/users/update-user'
import { AddressPayload } from '@medusajs/medusa/dist/types/common'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest, Validator } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { JAPANESE_COUNTRY_ISO2 } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { NotificationSettingService } from '../../notification/services/notification-setting.service'
import { UpdateStoreCustomerInfoReq } from '../../store/controllers/profile/update-customer-info.admin.controller'
import { Gender } from '../../store/entity/store-detail.entity'
import { StoreDetailService } from '../../store/services/store-detail.service'
import { isAdmin } from '../constant'
import { UserStatus, UserType } from '../entity/user.entity'
import CustomerService from '../services/customer.service'
import UserService from '../services/user.service'
import { UserHistoryService } from '../services/user-history.service'

@Validator({ override: AddressPayload })
export class ExtendedAddressPayload extends AddressPayload {
  @IsString()
  @IsOptional()
  prefecture_id?: string
}

@Validator({ override: StorePostCustomersCustomerAddressesAddressReq })
export class ExtendedStorePostCustomersCustomerAddressesAddressReq {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ExtendedAddressPayload)
  address: ExtendedAddressPayload
}

/**
 * @oas [patch] /user/{id}/cms
 * operationId: UpdateUserAdmin
 * summary: "Update a User for Admin CMS"
 * description: "Update a User for Admin CMS"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the User.
 * requestBody:
 *   description: Params to update user
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCMSUpdateUserReq"
 * tags:
 *   - User
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
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
  const { id } = req.params
  const userService = req.scope.resolve('userService') as UserService
  const customerService: CustomerService = req.scope.resolve(
    'customerService',
  ) as CustomerService

  const storeDetailService: StoreDetailService = req.scope.resolve(
    'storeDetailService',
  ) as StoreDetailService

  const userHistoryService: UserHistoryService = req.scope.resolve(
    'userHistoryService',
  ) as UserHistoryService

  const notificationService = req.scope.resolve(
    'notificationSettingService',
  ) as NotificationSettingService

  const manager = req.scope.resolve('manager') as EntityManager

  const validated = await validator(AdminCMSUpdateUserReq, req.body)
  const {
    nickname,
    email,
    type,
    first_name,
    last_name,
    api_token,
    role,
    status,
    is_newletter,
    metadata,
    gb_flg,
    ...rest
  } = validated

  const user = await userService.retrieve(id, {
    relations: ['address'],
  })

  const storeDetail: UpdateStoreCustomerInfoReq = {
    firstname: first_name,
    lastname: last_name,
    firstname_kana: rest.firstname_kana,
    lastname_kana: rest.lastname_kana,
    addr_01: rest.address_1,
    addr_02: rest.address_2,
    post_code: rest.postal_code,
    prefecture_id: rest.prefecture_id,
    birthday: rest.birthday,
    gender: rest.gender,
    tel_number: rest.phone,
  }

  await manager.transaction(async (tx) => {
    await userHistoryService.withTransaction(tx).create_(id, loggedInUser.id)

    await storeDetailService.withTransaction(tx).updateCms(user.id, storeDetail)

    await customerService.withTransaction(tx).update_(user.id, {
      first_name: first_name,
      last_name: last_name,
      nickname: nickname,
      phone: rest.phone,
    })

    await userService.withTransaction(tx).update_(id, {
      nickname,
      type,
      last_name,
      first_name,
      email,
      status,
      metadata: metadata,
      gb_flg,
    })

    await notificationService.withTransaction(tx).update_(id, { is_newletter })

    if (user.address_id && user.address) {
      await customerService
        .withTransaction(tx)
        .updateAddressCms(user.address_id, {
          first_name: first_name,
          last_name: last_name,
          country_code: JAPANESE_COUNTRY_ISO2,
          ...rest,
        })
    } else {
      await customerService.withTransaction(tx).addAddress(user.id, {
        first_name: first_name,
        last_name: last_name,
        country_code: JAPANESE_COUNTRY_ISO2,
        ...rest,
        metadata: metadata,
      })
    }
  })

  const rs = await userService.retrieve(id, {
    relations: ['address'],
  })

  res.status(200).json({ user: rs })
}

/**
 * @schema AdminCMSUpdateUserReq
 * title: "AdminCMSUpdateUserReq"
 * description: "Admin CMS update user req"
 * x-resourceId: AdminCMSUpdateUserReq
 * type: object
 * properties:
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
 *  is_newletter:
 *    type: boolean
 *  gb_flg:
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
export class AdminCMSUpdateUserReq extends AdminUpdateUserRequest {
  @IsString()
  @IsOptional()
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
  @IsOptional()
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
  is_newletter: boolean

  @IsBoolean()
  @IsOptional()
  gb_flg: boolean

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
