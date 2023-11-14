/* eslint-disable @typescript-eslint/no-unused-vars */
import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import UserService from '../../../user/services/user.service'
import {
  StoreBusinessForm,
  StorePlanType,
  StoreStatus,
} from '../../entity/store.entity'
import { Gender, StorePaymentMethod } from '../../entity/store-detail.entity'
import StoreService from '../../services/store.service'
import { StoreDetailService } from '../../services/store-detail.service'
import { StoreHistoryService } from '../../services/store-history.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [patch] /store/{id}/cms
 * operationId: "UpdateStoreAdminCms"
 * summary: "update store admin cms"
 * description: "update store admin cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * requestBody:
 *   description: Params to update shop information
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateStoreCMSReq"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/store"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 *
 */
const updateStoreCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const { id } = req.params
  const storeService = req.scope.resolve('storeService') as StoreService
  const storeDetailService = req.scope.resolve(
    'storeDetailService',
  ) as StoreDetailService

  const storeHistoryService = req.scope.resolve(
    'storeHistoryService',
  ) as StoreHistoryService

  const userService = req.scope.resolve('userService') as UserService
  const manager = req.scope.resolve('manager') as EntityManager

  const validated = await validator(UpdateStoreCMSReq, req.body)

  const {
    status,
    name,
    url,
    nickname,
    email,
    owner_id,
    margin_rate,
    spec_rate,
    spec_starts_at,
    spec_ends_at,
    is_return_guarantee,
    has_photo_service,
    business_form,
    payment_method,
    ...rest
  } = validated

  const store = await storeService.retrieve_(id, {
    select: ['id', 'store_detail_id', 'owner_id'],
  })
  let userId = store.owner_id
  if (owner_id) {
    const user = await userService.retrieve(owner_id)
    if (user) {
      userId = owner_id
    } else {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Can not update because owner not found',
      )
    }
  }
  await manager.transaction(async (tx) => {
    await storeHistoryService.withTransaction(tx).create_(loggedInUser.id, id)

    const store = await storeService.withTransaction(tx).update_(id, validated)

    await storeDetailService
      .withTransaction(tx)
      .update_(store.owner_id, store.id, {
        business_form,
        payment_method,
        ...rest,
      })

    await userService.withTransaction(tx).update_(userId, { nickname, email })
  })

  const newstore = await storeService.retrieve_(id, {
    relations: ['store_detail', 'owner', 'payback_setting'],
  })

  res.json(newstore)
}
export default updateStoreCmsController

/**
 * @schema UpdateStoreCMSReq
 * title: "UpdateStoreCMSReq"
 * description: "update store cms params"
 * x-resourceId: UpdateStoreCMSReq
 * type: object
 * properties:
 *  status:
 *    $ref: "#/components/schemas/StoreStatusEnum"
 *  url:
 *    type: string
 *    description: URL of shop
 *  name:
 *    type: string
 *    description: Name of shop
 *  nickname:
 *    type: string
 *  email:
 *    type: string
 *  firstname:
 *    type: string
 *    description: "Kanji first nanme of the seller"
 *  lastname:
 *    type: string
 *  firstname_kana:
 *    type: string
 *    description: "Furigana first nanme of the seller"
 *  lastname_kana:
 *    type: string
 *    description: "Furigana last nanme of the seller"
 *  gender:
 *    $ref: "#/components/schemas/GenderEnum"
 *  post_code:
 *    type: string
 *  addr_01:
 *    type: string
 *    maxLength: 16
 *    description: "Street name of the store"
 *  addr_02:
 *    type: string
 *    maxLength: 16
 *    description: "Building name of the store"
 *  prefecture_id:
 *    type: string
 *    description: "Prefecture id of the store"
 *  tel_number:
 *    type: string
 *    description: "Phone number of the seller"
 *  birthday:
 *    type: string
 *    format: date
 *    description: "Date of birth of the seller"
 *  mobile_number:
 *    type: string
 *    description: "Mobile number of the seller"
 *  emerge_number:
 *    type: string
 *    description: "Emergency phone number number of the seller"
 *  company_name:
 *    type: string
 *    description: "Kanji corporation name of the rep"
 *  company_name_kana:
 *    type: string
 *    description: "Furigana corporation name of the rep"
 *  contact_firstname:
 *    type: string
 *    minLength: 16
 *    description: "Curator kanji first name"
 *  contact_lastname:
 *    type: string
 *    description: "Curator kanji first name"
 *  contact_firstname_kana:
 *    type: string
 *    description: "Curator furigana first name"
 *  contact_lastname_kana:
 *    type: string
 *    description: "Curator furigana last name"
 *  contact_tel:
 *    type: string
 *    description: "Curator's phone number"
 *  company_official_name:
 *    type: string
 *  registration_number:
 *    type: string
 *  payment_method:
 *    $ref: "#/components/schemas/StorePaymentMethod"
 *  referral_code:
 *    type: string
 *  owner_id:
 *    type: string
 *  plan_type:
 *    $ref: "#/components/schemas/StorePlanTypeEnum"
 *  margin_rate:
 *    type: number
 *  spec_rate:
 *    type: number
 *  spec_starts_at:
 *    type: string
 *    format: date-time
 *  spec_ends_at:
 *    type: string
 *    format: date-time
 *  is_return_guarantee:
 *    type: boolean
 *  has_photo_service:
 *    type: boolean
 *  metadata:
 *    type: object
 *    description: An optional key-value map with additional details
 *    example: {car: "white"}
 *  business_form:
 *    $ref: "#/components/schemas/StoreBusinessFormEnum"
 */
export class UpdateStoreCMSReq {
  @IsString()
  @IsOptional()
  name: string

  @IsEnum(StorePlanType, {
    always: true,
    message: `Invalid value (plan_type must be one of following values: [${Object.values(
      StorePlanType,
    ).join(',')}])`,
  })
  @IsOptional()
  plan_type: StorePlanType

  @IsOptional()
  @IsEnum(StoreBusinessForm, {
    always: true,
    message: `Invalid value (business_form must be one of following values: [${Object.values(
      StoreBusinessForm,
    ).join(',')}])`,
  })
  business_form: StoreBusinessForm

  @IsOptional()
  @IsEnum(StoreStatus, {
    always: true,
    message: `Invalid value (status must be one of following values: [${Object.values(
      StoreStatus,
    ).join(',')}])`,
  })
  status?: StoreStatus

  @IsOptional()
  @IsString()
  url: string

  @IsString()
  @IsOptional()
  nickname: string

  @IsEmail()
  @IsOptional()
  email: string

  @IsString()
  @IsOptional()
  firstname?: string

  @IsString()
  @IsOptional()
  lastname?: string

  @IsString()
  @IsOptional()
  firstname_kana?: string

  @IsString()
  @IsOptional()
  lastname_kana?: string

  @IsString()
  @IsOptional()
  post_code?: string

  @IsString()
  @IsOptional()
  prefecture_id?: string

  @IsString()
  @IsOptional()
  addr_01?: string

  @IsString()
  @IsOptional()
  addr_02?: string

  @IsString()
  @IsOptional()
  tel_number?: string

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

  // for individual
  @IsOptional()
  @IsString()
  mobile_number?: string

  @IsOptional()
  @IsString()
  emerge_number?: string

  // for company
  @IsOptional()
  @IsString()
  company_name?: string

  @IsOptional()
  @IsString()
  company_name_kana?: string

  @IsOptional()
  @IsString()
  contact_firstname?: string

  @IsOptional()
  @IsString()
  contact_lastname?: string

  @IsOptional()
  @IsString()
  contact_firstname_kana?: string

  @IsOptional()
  @IsString()
  contact_lastname_kana?: string

  @IsOptional()
  @IsString()
  contact_tel?: string

  @IsOptional()
  @IsString()
  company_official_name?: string

  @IsOptional()
  @IsString()
  registration_number?: string

  @IsOptional()
  @IsEnum(StorePaymentMethod, {
    always: true,
    message: `Invalid value (payment method must be one of following values: [${Object.values(
      StorePaymentMethod,
    ).join(',')}])`,
  })
  payment_method?: StorePaymentMethod

  @IsOptional()
  @IsString()
  referral_code?: string

  @IsOptional()
  @IsString()
  owner_id?: string

  @IsNumber()
  @IsOptional()
  margin_rate?: number

  @IsNumber()
  @IsOptional()
  spec_rate?: number

  @IsOptional()
  spec_starts_at?: Date

  @IsOptional()
  spec_ends_at?: Date

  @IsBoolean()
  @IsOptional()
  is_return_guarantee?: boolean

  @IsBoolean()
  @IsOptional()
  has_photo_service?: boolean

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}
